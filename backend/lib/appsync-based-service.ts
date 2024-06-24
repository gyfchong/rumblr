import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Tracing, Runtime } from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";

import { join } from "path";

export interface AppSyncBasedServiceProps {
  readonly serviceName: string;
}

export class AppSyncBasedService extends Construct {
  readonly graphQLApiEndpoint: string;
  readonly apiKey: string;

  constructor(scope: Construct, id: string, props: AppSyncBasedServiceProps) {
    super(scope, id);

    // Create GraphQL API
    const api = new appsync.GraphqlApi(this, "Api", {
      name: props.serviceName,
      definition: appsync.Definition.fromFile(
        join(__dirname, `${props.serviceName}.graphql`)
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(364)),
          },
        },
      },
      xrayEnabled: true,
    });

    this.graphQLApiEndpoint = api.graphqlUrl;
    this.apiKey = api.apiKey!;

    // Create Lambda JS Function to translate AWS GraphQL to Apollo GraphQL
    const lambdaApolloResolver = new lambda.NodejsFunction(
      this,
      "lambdaApolloResolver",
      {
        entry: join(__dirname, `${props.serviceName}-resolver.ts`),
        environment: {
          SCHEMA: api.schema
            .bind(api)
            .definition.replace("__typename: String!", ""),
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_20_X,
      }
    );

    // create DynamoDB table
    const postsTable = new dynamodb.TableV2(this, "RumblrPostsTable", {
      billing: dynamodb.Billing.onDemand(),
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Grant full access to the Lambda Apollo Resolver
    postsTable.grantFullAccess(lambdaApolloResolver);

    // create S3 Bucket
    const s3Bucket = new s3.Bucket(this, "RumblrS3Bucket", {
      bucketName: "rumblr-assets",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
    });

    // Grant full access to the Lambda Apollo Resolver
    s3Bucket.grantReadWrite(lambdaApolloResolver);

    // Create Lambda Data Source for the GraphQl API
    const lambdaDS = api.addLambdaDataSource("LambdaDS", lambdaApolloResolver);

    // Create Lambda functions to resolve GraphQL queries
    lambdaDS.createResolver("QueryService", {
      typeName: "Query",
      fieldName: "_service",
    });

    // lambdaDS.createResolver("QueryEntities", {
    //   typeName: "Query",
    //   fieldName: "_entities",
    // });

    // TODO infer from schema
    lambdaDS.createResolver("QueryPosts", {
      typeName: "Query",
      fieldName: "post",
    });

    lambdaDS.createResolver("QueryPostsAuthor", {
      typeName: "Post",
      fieldName: "author",
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, "ApiKeyOutput", {
      value: api.apiKey || "",
    });
  }
}
