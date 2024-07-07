import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as appsync from "aws-cdk-lib/aws-appsync"
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import { Tracing, Runtime } from "aws-cdk-lib/aws-lambda"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as iam from "aws-cdk-lib/aws-iam"
import * as s3 from "aws-cdk-lib/aws-s3"

import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = dirname(__filename) // get the name of the directory

export interface AppSyncBasedServiceProps {
  readonly serviceName: string
}

export class AppSyncBasedService extends Construct {
  readonly graphQLApiEndpoint: string
  readonly apiKey: string

  constructor(scope: Construct, id: string, props: AppSyncBasedServiceProps) {
    super(scope, id)

    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      identityPoolName: "rumblr-identity-pool",
      allowUnauthenticatedIdentities: true, // Allow unauthenticated access
      cognitoIdentityProviders: [
        {
          clientId: "ap-southeast-2:0053bc04-f246-4b0f-9d3a-1cddce306dcb",
          providerName: "Amazon Cognito user pool",
        },
      ],
    })

    const unauthenticatedPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: "AllActions",
          actions: ["appsync:GraphQL"],
          resources: ["arn:aws:appsync:*:*:apis/*/types/*/fields/*"],
        }),
      ],
    })

    // Attach policy to new IAM role
    const unauthenticatedRole = new iam.Role(
      this,
      "CognitoDefaultUnauthenticatedRole",
      {
        roleName: `cognito-default-unauthenticated-role`,
        description:
          "IAM Role to be assumed by Cognito for unauthenticated user",
        managedPolicies: [unauthenticatedPolicyDocument.toJSON()],
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.attrId,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          }
        ),
      }
    )

    // Attach role to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: identityPool.attrId,
        roles: {
          unauthenticated: unauthenticatedRole.roleArn,
        },
      }
    )

    // Create GraphQL API
    const api = new appsync.GraphqlApi(this, "Api", {
      name: props.serviceName,
      definition: appsync.Definition.fromFile(
        join(__dirname, `${props.serviceName}.graphql`)
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
          // userPoolConfig: {
          //   userPool: {
          //     userPoolId: "ap-southeast-2_p9S9UnFWs",
          //     userPoolArn:
          //       "arn:aws:cognito-idp:ap-southeast-2:867222587325:userpool/ap-southeast-2_p9S9UnFWs",
          //     identityProviders: [],
          //   },
          // },
        },
      },
      xrayEnabled: true,
    })

    this.graphQLApiEndpoint = api.graphqlUrl
    this.apiKey = api.apiKey!

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
        runtime: Runtime.NODEJS_LATEST,
      }
    )

    // create DynamoDB table
    const postsTable = new dynamodb.TableV2(this, "RumblrPostsTable", {
      billing: dynamodb.Billing.onDemand(),
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
    })

    // Grant full access to the Lambda Apollo Resolver
    postsTable.grantFullAccess(lambdaApolloResolver)

    // create S3 Bucket
    const s3Bucket = new s3.Bucket(this, "RumblrS3Bucket", {
      bucketName: "rumblr-assets",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
    })

    // Grant full access to the Lambda Apollo Resolver
    s3Bucket.grantReadWrite(lambdaApolloResolver)

    // Create Lambda Data Source for the GraphQl API
    const lambdaDS = api.addLambdaDataSource("LambdaDS", lambdaApolloResolver)

    // Create Lambda functions to resolve GraphQL queries
    lambdaDS.createResolver("QueryService", {
      typeName: "Query",
      fieldName: "_service",
    })

    // lambdaDS.createResolver("QueryEntities", {
    //   typeName: "Query",
    //   fieldName: "_entities",
    // });

    // TODO infer from schema
    lambdaDS.createResolver("QueryPosts", {
      typeName: "Query",
      fieldName: "post",
    })

    lambdaDS.createResolver("QueryPostsAuthor", {
      typeName: "Post",
      fieldName: "author",
    })

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.graphqlUrl,
    })

    new cdk.CfnOutput(this, "ApiKeyOutput", {
      value: api.apiKey || "",
    })
  }
}
