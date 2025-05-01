export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
    [x: string]: JSONValue;
}

type JSONArray = Array<JSONValue>;
