import Quote from "./Quote";
import * as Tweet from "twitter-d";

export default interface BaseData {
  baselineText: string;
  baseline: Quote | null | undefined;
  endDate: Object; // TODO: Moment.js bindings?
  lastD3Event: Object | null;
  quotes: Quote[];
  tweets: Tweet.Status[];
  startDate: Object;
  symbols: Array<string>;
  symbolsText: string;
}

