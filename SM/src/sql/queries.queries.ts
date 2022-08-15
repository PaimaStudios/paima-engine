/** Types generated for queries found in "src/sql/queries.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetLatestBlockHeight' parameters type */
export type IGetLatestBlockHeightParams = void;

/** 'GetLatestBlockHeight' return type */
export interface IGetLatestBlockHeightResult {
  block_height: number;
  done: boolean;
  seed: string;
}

/** 'GetLatestBlockHeight' query type */
export interface IGetLatestBlockHeightQuery {
  params: IGetLatestBlockHeightParams;
  result: IGetLatestBlockHeightResult;
}

const getLatestBlockHeightIR: any = {"name":"getLatestBlockHeight","params":[],"usedParamSet":{},"statement":{"body":"SELECT * FROM block_heights \nORDER BY block_height DESC\nLIMIT 1","loc":{"a":33,"b":95,"line":2,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM block_heights 
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestBlockHeight = new PreparedQuery<IGetLatestBlockHeightParams,IGetLatestBlockHeightResult>(getLatestBlockHeightIR);


/** 'GetRandomness' parameters type */
export type IGetRandomnessParams = void;

/** 'GetRandomness' return type */
export interface IGetRandomnessResult {
  seed: string;
}

/** 'GetRandomness' query type */
export interface IGetRandomnessQuery {
  params: IGetRandomnessParams;
  result: IGetRandomnessResult;
}

const getRandomnessIR: any = {"name":"getRandomness","params":[],"usedParamSet":{},"statement":{"body":"SELECT seed FROM block_heights\nORDER BY block_height DESC\nLIMIT 25","loc":{"a":125,"b":190,"line":7,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * SELECT seed FROM block_heights
 * ORDER BY block_height DESC
 * LIMIT 25
 * ```
 */
export const getRandomness = new PreparedQuery<IGetRandomnessParams,IGetRandomnessResult>(getRandomnessIR);


/** 'GetScheduledDataByBlockHeight' parameters type */
export interface IGetScheduledDataByBlockHeightParams {
  block_height: number;
}

/** 'GetScheduledDataByBlockHeight' return type */
export interface IGetScheduledDataByBlockHeightResult {
  block_height: number;
  id: number;
  input_data: string;
}

/** 'GetScheduledDataByBlockHeight' query type */
export interface IGetScheduledDataByBlockHeightQuery {
  params: IGetScheduledDataByBlockHeightParams;
  result: IGetScheduledDataByBlockHeightResult;
}

const getScheduledDataByBlockHeightIR: any = {"name":"getScheduledDataByBlockHeight","params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":287,"b":299,"line":13,"col":22}]}}],"usedParamSet":{"block_height":true},"statement":{"body":"SELECT * from scheduled_data\nWHERE block_height = :block_height!\nORDER BY id ASC","loc":{"a":236,"b":315,"line":12,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * SELECT * from scheduled_data
 * WHERE block_height = :block_height!
 * ORDER BY id ASC
 * ```
 */
export const getScheduledDataByBlockHeight = new PreparedQuery<IGetScheduledDataByBlockHeightParams,IGetScheduledDataByBlockHeightResult>(getScheduledDataByBlockHeightIR);


/** 'SaveLastBlockHeight' parameters type */
export interface ISaveLastBlockHeightParams {
  block_height: number;
  seed: string;
}

/** 'SaveLastBlockHeight' return type */
export type ISaveLastBlockHeightResult = void;

/** 'SaveLastBlockHeight' query type */
export interface ISaveLastBlockHeightQuery {
  params: ISaveLastBlockHeightParams;
  result: ISaveLastBlockHeightResult;
}

const saveLastBlockHeightIR: any = {"name":"saveLastBlockHeight","params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":407,"b":419,"line":18,"col":9}]}},{"name":"seed","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":423,"b":427,"line":18,"col":25}]}}],"usedParamSet":{"block_height":true,"seed":true},"statement":{"body":"INSERT INTO block_heights(block_height, seed)\nVALUES (:block_height!, :seed!)","loc":{"a":352,"b":428,"line":17,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO block_heights(block_height, seed)
 * VALUES (:block_height!, :seed!)
 * ```
 */
export const saveLastBlockHeight = new PreparedQuery<ISaveLastBlockHeightParams,ISaveLastBlockHeightResult>(saveLastBlockHeightIR);


/** 'BlockHeightDone' parameters type */
export interface IBlockHeightDoneParams {
  block_height: number;
}

/** 'BlockHeightDone' return type */
export type IBlockHeightDoneResult = void;

/** 'BlockHeightDone' query type */
export interface IBlockHeightDoneQuery {
  params: IBlockHeightDoneParams;
  result: IBlockHeightDoneResult;
}

const blockHeightDoneIR: any = {"name":"blockHeightDone","params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":519,"b":531,"line":24,"col":22}]}}],"usedParamSet":{"block_height":true},"statement":{"body":"UPDATE block_heights\nSET\ndone = true\nWHERE block_height = :block_height!","loc":{"a":460,"b":531,"line":21,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * UPDATE block_heights
 * SET
 * done = true
 * WHERE block_height = :block_height!
 * ```
 */
export const blockHeightDone = new PreparedQuery<IBlockHeightDoneParams,IBlockHeightDoneResult>(blockHeightDoneIR);


/** 'DeleteScheduled' parameters type */
export interface IDeleteScheduledParams {
  id: number;
}

/** 'DeleteScheduled' return type */
export type IDeleteScheduledResult = void;

/** 'DeleteScheduled' query type */
export interface IDeleteScheduledQuery {
  params: IDeleteScheduledParams;
  result: IDeleteScheduledResult;
}

const deleteScheduledIR: any = {"name":"deleteScheduled","params":[{"name":"id","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":602,"b":604,"line":28,"col":12}]}}],"usedParamSet":{"id":true},"statement":{"body":"DELETE FROM scheduled_data\nWHERE id = :id!","loc":{"a":563,"b":604,"line":27,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM scheduled_data
 * WHERE id = :id!
 * ```
 */
export const deleteScheduled = new PreparedQuery<IDeleteScheduledParams,IDeleteScheduledResult>(deleteScheduledIR);


/** 'FindNonce' parameters type */
export interface IFindNonceParams {
  nonce: string | null | void;
}

/** 'FindNonce' return type */
export interface IFindNonceResult {
  block_height: number;
  nonce: string;
}

/** 'FindNonce' query type */
export interface IFindNonceQuery {
  params: IFindNonceParams;
  result: IFindNonceResult;
}

const findNonceIR: any = {"name":"findNonce","params":[{"name":"nonce","required":false,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":666,"b":670,"line":32,"col":15}]}}],"usedParamSet":{"nonce":true},"statement":{"body":"SELECT * FROM nonces\nWHERE nonce = :nonce","loc":{"a":630,"b":670,"line":31,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM nonces
 * WHERE nonce = :nonce
 * ```
 */
export const findNonce = new PreparedQuery<IFindNonceParams,IFindNonceResult>(findNonceIR);


/** 'InsertNonce' parameters type */
export interface IInsertNonceParams {
  block_height: number;
  nonce: string;
}

/** 'InsertNonce' return type */
export type IInsertNonceResult = void;

/** 'InsertNonce' query type */
export interface IInsertNonceQuery {
  params: IInsertNonceParams;
  result: IInsertNonceResult;
}

const insertNonceIR: any = {"name":"insertNonce","params":[{"name":"nonce","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":747,"b":752,"line":36,"col":9}]}},{"name":"block_height","required":true,"transform":{"type":"scalar"},"codeRefs":{"used":[{"a":756,"b":768,"line":36,"col":18}]}}],"usedParamSet":{"nonce":true,"block_height":true},"statement":{"body":"INSERT INTO nonces(nonce, block_height)\nVALUES (:nonce!, :block_height!)","loc":{"a":698,"b":769,"line":35,"col":0}}};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO nonces(nonce, block_height)
 * VALUES (:nonce!, :block_height!)
 * ```
 */
export const insertNonce = new PreparedQuery<IInsertNonceParams,IInsertNonceResult>(insertNonceIR);


