/**
 * Created by snytkind on 12/17/16.
 */

export const enum ParsedBodyType {
  TO_TEXT,
  TO_JSON,
  TO_XML
}

/**
 * @todo add type property to indicate if we want body to be string/json/(in the future maybe also xml)
 * This will be used by bodyParser in case where we don't need to parse body as json
 * but only to turn it into a string
 *
 * @todo rename IBodyParserOptions to just BodyParserOptions because body parser may also
 * be parsing body to a string or possibly to xml
 *
 */
export interface IBodyParserOptions {
  length?: number
  limit?: number
  encoding?: string
  reviver?: (key: any, value: any) => any
  schema?:any
  proto?:any
  parsedBodyType:ParsedBodyType
}
