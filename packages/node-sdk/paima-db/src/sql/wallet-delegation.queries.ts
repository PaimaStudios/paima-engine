/** Types generated for queries found in "src/sql/wallet-delegation.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'NewAddress' parameters type */
export interface INewAddressParams {
  address: string;
}

/** 'NewAddress' return type */
export type INewAddressResult = void;

/** 'NewAddress' query type */
export interface INewAddressQuery {
  params: INewAddressParams;
  result: INewAddressResult;
}

const newAddressIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":41,"b":49}]}],"statement":"INSERT INTO addresses (address) \nVALUES (:address!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO addresses (address) 
 * VALUES (:address!)
 * ```
 */
export const newAddress = new PreparedQuery<INewAddressParams,INewAddressResult>(newAddressIR);


/** 'NewAddressWithId' parameters type */
export interface INewAddressWithIdParams {
  address: string;
  id: number;
}

/** 'NewAddressWithId' return type */
export type INewAddressWithIdResult = void;

/** 'NewAddressWithId' query type */
export interface INewAddressWithIdQuery {
  params: INewAddressWithIdParams;
  result: INewAddressWithIdResult;
}

const newAddressWithIdIR: any = {"usedParamSet":{"address":true,"id":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":53}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":59}]}],"statement":"INSERT INTO addresses (address, id) \nVALUES (:address!, :id!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO addresses (address, id) 
 * VALUES (:address!, :id!)
 * ```
 */
export const newAddressWithId = new PreparedQuery<INewAddressWithIdParams,INewAddressWithIdResult>(newAddressWithIdIR);


/** 'NewDelegation' parameters type */
export interface INewDelegationParams {
  from_id: number;
  set_id: number;
}

/** 'NewDelegation' return type */
export type INewDelegationResult = void;

/** 'NewDelegation' query type */
export interface INewDelegationQuery {
  params: INewDelegationParams;
  result: INewDelegationResult;
}

const newDelegationIR: any = {"usedParamSet":{"from_id":true,"set_id":true},"params":[{"name":"from_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":51,"b":59}]},{"name":"set_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":69}]}],"statement":"INSERT INTO delegations (from_id, set_id) \nVALUES (:from_id!, :set_id!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO delegations (from_id, set_id) 
 * VALUES (:from_id!, :set_id!)
 * ```
 */
export const newDelegation = new PreparedQuery<INewDelegationParams,INewDelegationResult>(newDelegationIR);


/** 'GetAddressFromId' parameters type */
export interface IGetAddressFromIdParams {
  id: number;
}

/** 'GetAddressFromId' return type */
export interface IGetAddressFromIdResult {
  address: string;
  id: number;
}

/** 'GetAddressFromId' query type */
export interface IGetAddressFromIdQuery {
  params: IGetAddressFromIdParams;
  result: IGetAddressFromIdResult;
}

const getAddressFromIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":35,"b":38}]}],"statement":"SELECT * FROM addresses\nWHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM addresses
 * WHERE id = :id!
 * ```
 */
export const getAddressFromId = new PreparedQuery<IGetAddressFromIdParams,IGetAddressFromIdResult>(getAddressFromIdIR);


/** 'GetAddressFromAddress' parameters type */
export interface IGetAddressFromAddressParams {
  address: string;
}

/** 'GetAddressFromAddress' return type */
export interface IGetAddressFromAddressResult {
  address: string;
  id: number;
}

/** 'GetAddressFromAddress' query type */
export interface IGetAddressFromAddressQuery {
  params: IGetAddressFromAddressParams;
  result: IGetAddressFromAddressResult;
}

const getAddressFromAddressIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":48}]}],"statement":"SELECT * FROM addresses\nWHERE address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM addresses
 * WHERE address = :address!
 * ```
 */
export const getAddressFromAddress = new PreparedQuery<IGetAddressFromAddressParams,IGetAddressFromAddressResult>(getAddressFromAddressIR);


/** 'GetDelegation' parameters type */
export interface IGetDelegationParams {
  from_id: number;
  set_id: number;
}

/** 'GetDelegation' return type */
export interface IGetDelegationResult {
  from_id: number;
  set_id: number;
}

/** 'GetDelegation' query type */
export interface IGetDelegationQuery {
  params: IGetDelegationParams;
  result: IGetDelegationResult;
}

const getDelegationIR: any = {"usedParamSet":{"from_id":true,"set_id":true},"params":[{"name":"from_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":42,"b":50}]},{"name":"set_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":65,"b":72}]}],"statement":"SELECT * FROM delegations\nWHERE from_id = :from_id!\nAND set_id = :set_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM delegations
 * WHERE from_id = :from_id!
 * AND set_id = :set_id!
 * ```
 */
export const getDelegation = new PreparedQuery<IGetDelegationParams,IGetDelegationResult>(getDelegationIR);


/** 'GetDelegationsFrom' parameters type */
export interface IGetDelegationsFromParams {
  from_id: number;
}

/** 'GetDelegationsFrom' return type */
export interface IGetDelegationsFromResult {
  from_id: number;
  set_id: number;
}

/** 'GetDelegationsFrom' query type */
export interface IGetDelegationsFromQuery {
  params: IGetDelegationsFromParams;
  result: IGetDelegationsFromResult;
}

const getDelegationsFromIR: any = {"usedParamSet":{"from_id":true},"params":[{"name":"from_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":42,"b":50}]}],"statement":"SELECT * FROM delegations\nWHERE from_id = :from_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM delegations
 * WHERE from_id = :from_id!
 * ```
 */
export const getDelegationsFrom = new PreparedQuery<IGetDelegationsFromParams,IGetDelegationsFromResult>(getDelegationsFromIR);


/** 'GetDelegationsTo' parameters type */
export interface IGetDelegationsToParams {
  set_id: number;
}

/** 'GetDelegationsTo' return type */
export interface IGetDelegationsToResult {
  from_id: number;
  set_id: number;
}

/** 'GetDelegationsTo' query type */
export interface IGetDelegationsToQuery {
  params: IGetDelegationsToParams;
  result: IGetDelegationsToResult;
}

const getDelegationsToIR: any = {"usedParamSet":{"set_id":true},"params":[{"name":"set_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":41,"b":48}]}],"statement":"SELECT * FROM delegations\nWHERE set_id = :set_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM delegations
 * WHERE set_id = :set_id!
 * ```
 */
export const getDelegationsTo = new PreparedQuery<IGetDelegationsToParams,IGetDelegationsToResult>(getDelegationsToIR);


/** 'DeleteDelegationFrom' parameters type */
export interface IDeleteDelegationFromParams {
  from_id: number;
}

/** 'DeleteDelegationFrom' return type */
export type IDeleteDelegationFromResult = void;

/** 'DeleteDelegationFrom' query type */
export interface IDeleteDelegationFromQuery {
  params: IDeleteDelegationFromParams;
  result: IDeleteDelegationFromResult;
}

const deleteDelegationFromIR: any = {"usedParamSet":{"from_id":true},"params":[{"name":"from_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":48}]}],"statement":"DELETE FROM delegations\nWHERE from_id = :from_id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM delegations
 * WHERE from_id = :from_id!
 * ```
 */
export const deleteDelegationFrom = new PreparedQuery<IDeleteDelegationFromParams,IDeleteDelegationFromResult>(deleteDelegationFromIR);


/** 'DeleteDelegationTo' parameters type */
export interface IDeleteDelegationToParams {
  set_id: number;
}

/** 'DeleteDelegationTo' return type */
export type IDeleteDelegationToResult = void;

/** 'DeleteDelegationTo' query type */
export interface IDeleteDelegationToQuery {
  params: IDeleteDelegationToParams;
  result: IDeleteDelegationToResult;
}

const deleteDelegationToIR: any = {"usedParamSet":{"set_id":true},"params":[{"name":"set_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":39,"b":46}]}],"statement":"DELETE FROM delegations\nWHERE set_id = :set_id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM delegations
 * WHERE set_id = :set_id!
 * ```
 */
export const deleteDelegationTo = new PreparedQuery<IDeleteDelegationToParams,IDeleteDelegationToResult>(deleteDelegationToIR);


/** 'DeleteAddress' parameters type */
export interface IDeleteAddressParams {
  address: string;
}

/** 'DeleteAddress' return type */
export type IDeleteAddressResult = void;

/** 'DeleteAddress' query type */
export interface IDeleteAddressQuery {
  params: IDeleteAddressParams;
  result: IDeleteAddressResult;
}

const deleteAddressIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":38,"b":46}]}],"statement":"DELETE FROM addresses\nWHERE address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM addresses
 * WHERE address = :address!
 * ```
 */
export const deleteAddress = new PreparedQuery<IDeleteAddressParams,IDeleteAddressResult>(deleteAddressIR);


/** 'DeleteAddressId' parameters type */
export interface IDeleteAddressIdParams {
  id: number;
}

/** 'DeleteAddressId' return type */
export type IDeleteAddressIdResult = void;

/** 'DeleteAddressId' query type */
export interface IDeleteAddressIdQuery {
  params: IDeleteAddressIdParams;
  result: IDeleteAddressIdResult;
}

const deleteAddressIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":33,"b":36}]}],"statement":"DELETE FROM addresses\nWHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM addresses
 * WHERE id = :id!
 * ```
 */
export const deleteAddressId = new PreparedQuery<IDeleteAddressIdParams,IDeleteAddressIdResult>(deleteAddressIdIR);


/** 'UpdateDelegateTo' parameters type */
export interface IUpdateDelegateToParams {
  new_to: number;
  old_to: number;
}

/** 'UpdateDelegateTo' return type */
export type IUpdateDelegateToResult = void;

/** 'UpdateDelegateTo' query type */
export interface IUpdateDelegateToQuery {
  params: IUpdateDelegateToParams;
  result: IUpdateDelegateToResult;
}

const updateDelegateToIR: any = {"usedParamSet":{"new_to":true,"old_to":true},"params":[{"name":"new_to","required":true,"transform":{"type":"scalar"},"locs":[{"a":33,"b":40}]},{"name":"old_to","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":64}]}],"statement":"UPDATE delegations \nSET set_id = :new_to!\nWHERE set_id = :old_to!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE delegations 
 * SET set_id = :new_to!
 * WHERE set_id = :old_to!
 * ```
 */
export const updateDelegateTo = new PreparedQuery<IUpdateDelegateToParams,IUpdateDelegateToResult>(updateDelegateToIR);


