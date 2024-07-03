import { AppSyncResolverEvent } from "aws-lambda"

const posts = [
  {
    id: "apollo-federation",
    content: "Hello federation",
    author: { email: "support@apollographql.com" },
  },
  {
    id: "apollo-studio",
    content: "Hello studio",
    author: { email: "support@apollographql.com" },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: AppSyncResolverEvent<any>) => {
  console.log(`event ${JSON.stringify(event)}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = []
  switch (event.info.parentTypeName) {
    case "Post":
      switch (event.info.fieldName) {
        case "author":
          result = posts.find(p => p.id === event.source!.id)?.author
          break
      }
      break
    case "Query":
      switch (event.info.fieldName) {
        case "post":
          result = posts.find(p => p.id === event.arguments.id)
          break
        case "_service":
          result = { sdl: process.env.SCHEMA }
          break
        case "__typename":
          result = { ftv1: "test" }
          break
      }
      break
  }
  console.log(`returning ${JSON.stringify(result)}`)
  return result
}
