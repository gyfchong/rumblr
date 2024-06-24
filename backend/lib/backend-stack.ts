import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const userPool = new UserPool(this, "RumblrMemberPool");
    new UserPoolClient(this, "RumblrMemberPoolClient", { userPool: userPool });

    const graphQLAPI = new appsync.GraphqlApi(this, "RumblrGraphQLAPI", {
      name: "rumblr-graphql",
      definition: appsync.Definition.fromSchema(
        appsync.SchemaFile.fromAsset(join(__dirname, "schema.graphql"))
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

    new cdk.CfnOutput(this, "ApiKeyOutput", {
      value: graphQLAPI.apiKey || "",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: graphQLAPI.graphqlUrl || "",
    });
  }
}
