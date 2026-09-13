import { IBaseHandler } from "./baseHandler";
import { TsAndJsHandler } from "./tsAndJsHandler";

export function getLanguageHandler(languange?: string): IBaseHandler {
  switch(languange) {
    case "typescript":
    case "javascript":
      return new TsAndJsHandler();
    default:
      throw new Error('Not Found the languageId.');
  }
}