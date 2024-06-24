import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ApolloBasedService } from "./apollo-based-graphql-service";
import { ApolloFederationGateway } from "./apollo-federation-gateway";
import { AppSyncBasedService } from "./appsync-based-service";

export class FederatedAppsyncApiDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const usersService = new ApolloBasedService(this, "UsersService", {
    //   serviceName: "users-service",
    // });

    // const reviewsService = new ApolloBasedService(this, "ReviewsService", {
    //   serviceName: "reviews-service",
    // });

    const postsService = new AppSyncBasedService(this, "PostsService", {
      serviceName: "posts-service",
    });

    new ApolloFederationGateway(this, "FederationGateway", {
      serviceList: [
        // {
        //   name: "User",
        //   url: usersService.graphQLApiEndpoint,
        // },
        // {
        //   name: "Review",
        //   url: reviewsService.graphQLApiEndpoint,
        // },
        {
          name: "Product",
          url: postsService.graphQLApiEndpoint,
        },
      ],
      apiKey: postsService.apiKey,
    });
  }
}
