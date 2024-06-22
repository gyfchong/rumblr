import { CDKContext } from "./../cdk.context.d";
import * as cdk from "aws-cdk-lib";
import {
  AmplifyGraphqlApi,
  AmplifyGraphqlDefinition,
} from "@aws-amplify/graphql-api-construct";
import { Construct } from "constructs";
import * as path from "path";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

export class BackendTripPostStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    context: CDKContext
  ) {
    super(scope, id, props);

    const userPool = new UserPool(this, "MyNewUserPool");
    new UserPoolClient(this, "MyNewUserPoolClient", { userPool: userPool });

    const amplifyApi = new AmplifyGraphqlApi(this, "MyNewApi", {
      definition: AmplifyGraphqlDefinition.fromFiles(
        path.join(__dirname, "schema.graphql")
      ),
      authorizationModes: {
        defaultAuthorizationMode: "API_KEY",
        apiKeyConfig: {
          expires: cdk.Duration.days(30),
        },
        userPoolConfig: {
          userPool: userPool,
        },
      },
    });
  }
}
