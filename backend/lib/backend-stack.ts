import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Tracing } from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";

export class AppSyncBasedServiceProps extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const userPool = new UserPool(this, "MyNewUserPool");
    new UserPoolClient(this, "MyNewUserPoolClient", { userPool: userPool });

    const schema = appsync.SchemaFile.fromAsset(
      join(__dirname, "schema.graphql")
    );

    new appsync.GraphqlApi(this, "MyNewApi", {
      name: "demo",
      definition: appsync.Definition.fromSchema(schema),
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

    new lambda.NodejsFunction(this, "lambdaResolver", {
      entry: join(__dirname, `${props?.stackName}-resolver.ts`),
      environment: {
        SCHEMA: schema.definition.replace("__typename: String!", ""), // We need to remove __typename from the definition to stay compliant with expected Apollo SDL format
      },
      tracing: Tracing.ACTIVE,
    });
  }
}
