import { AppSyncResolverEvent } from "aws-lambda";

// Handler resolving the entities from representations argument
export const handler = async (event: AppSyncResolverEvent<any>) => {
  console.log(`event ${JSON.stringify(event)}`);

  let result: any = [];
  switch (event.info.parentTypeName) {
    case "Query":
      switch (event.info.fieldName) {
        case "_service":
          result = { sdl: process.env.SCHEMA };
          break;
      }
      break;
  }
  return result;
};
