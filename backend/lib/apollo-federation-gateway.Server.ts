import { ApolloServer } from "apollo-server-lambda"
import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway"
import * as AWSXray from "aws-xray-sdk-core"
import * as https from "https"
import * as http from "http"

AWSXray.captureHTTPsGlobal(https, true)
AWSXray.captureHTTPsGlobal(http, true)

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  willSendRequest({ request }: any) {
    // Pass the user's id from the context to each subgraph
    // as a header called `user-id`
    request.http.headers.set("x-api-key", process.env.API_KEY)
  }
}

// Initialize an ApolloGateway instance and pass it
// the supergraph schema
const gateway = new ApolloGateway({
  serviceList: JSON.parse(process.env.SERVICE_LIST!),
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  },
})

// Pass the ApolloGateway to the ApolloServer constructor
const server = new ApolloServer({
  gateway,
  debug: true,
  introspection: true,
})

exports.handler = server.createHandler()
