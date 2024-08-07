import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs"
import { Tracing, Runtime } from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = dirname(__filename) // get the name of the directory
export interface ApolloBasedServiceProps {
  readonly serviceName: number
}
export class ApolloBasedService extends Construct {
  readonly graphQLApiEndpoint: string
  constructor(scope: Construct, id: string, props: ApolloBasedServiceProps) {
    super(scope, id)

    //  Service hosted by an Apollo server running on AWS Lambda
    const apolloServer = new lambda.NodejsFunction(this, `ApolloServer`, {
      entry: join(__dirname, `${props.serviceName}.Server.ts`),
      timeout: cdk.Duration.seconds(30),
      tracing: Tracing.ACTIVE,
      runtime: Runtime.NODEJS_LATEST,
    })

    const grapqhQLApi = new apigateway.RestApi(this, `Api`, {
      restApiName: `${props.serviceName} graphql endpoint`,
      description: `This service serves ${props.serviceName} data through apollo graphql`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // this is also the default
      },
      deployOptions: {
        tracingEnabled: true,
      },
    })

    const graphqlPostIntegration = new apigateway.LambdaIntegration(
      apolloServer
    )

    grapqhQLApi.root.addMethod("POST", graphqlPostIntegration)

    this.graphQLApiEndpoint = grapqhQLApi.url
  }
}
