/** Types generated for queries found in "src/sql/historical.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'StoreGameInput' parameters type */
export interface IStoreGameInputParams {
  block_height: number;
  input_data: string;
  user_address: string;
}

/** 'StoreGameInput' return type */
export type IStoreGameInputResult = void;

/** 'StoreGameInput' query type */
export interface IStoreGameInputQuery {
  params: IStoreGameInputParams;
  result: IStoreGameInputResult;
}

const storeGameInputIR: any = {"usedParamSet":{"block_height":true,"user_address":true,"input_data":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":83,"b":96}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":112}]},{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":115,"b":126}]}],"statement":"INSERT INTO historical_game_inputs(block_height, user_address, input_data)\nVALUES (:block_height!, :user_address!, :input_data!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO historical_game_inputs(block_height, user_address, input_data)
 * VALUES (:block_height!, :user_address!, :input_data!)
 * ```
 */
export const storeGameInput = new PreparedQuery<IStoreGameInputParams,IStoreGameInputResult>(storeGameInputIR);


