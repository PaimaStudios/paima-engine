/** Types generated for queries found in "src/sql/queries.sql" */
import { PreparedQuery } from '@pgtyped/query';

export type input_state = 'accepted' | 'posted' | 'rejected' | 'validating';

/** 'InsertUnvalidatedInput' parameters type */
export interface IInsertUnvalidatedInputParams {
  address_type: number;
  game_input: string;
  millisecond_timestamp: string;
  user_address: string;
  user_signature: string;
}

/** 'InsertUnvalidatedInput' return type */
export type IInsertUnvalidatedInputResult = void;

/** 'InsertUnvalidatedInput' query type */
export interface IInsertUnvalidatedInputQuery {
  params: IInsertUnvalidatedInputParams;
  result: IInsertUnvalidatedInputResult;
}

const insertUnvalidatedInputIR: any = {
  usedParamSet: {
    address_type: true,
    user_address: true,
    game_input: true,
    millisecond_timestamp: true,
    user_signature: true,
  },
  params: [
    {
      name: 'address_type',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 138, b: 151 }],
    },
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 156, b: 169 }],
    },
    {
      name: 'game_input',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 174, b: 185 }],
    },
    {
      name: 'millisecond_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 190, b: 212 }],
    },
    {
      name: 'user_signature',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 217, b: 232 }],
    },
  ],
  statement:
    'INSERT INTO unvalidated_game_inputs(\n  address_type,\n  user_address,\n  game_input,\n  millisecond_timestamp,\n  user_signature\n) VALUES (\n  :address_type!,\n  :user_address!,\n  :game_input!,\n  :millisecond_timestamp!,\n  :user_signature!\n)',
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO unvalidated_game_inputs(
 *   address_type,
 *   user_address,
 *   game_input,
 *   millisecond_timestamp,
 *   user_signature
 * ) VALUES (
 *   :address_type!,
 *   :user_address!,
 *   :game_input!,
 *   :millisecond_timestamp!,
 *   :user_signature!
 * )
 * ```
 */
export const insertUnvalidatedInput = new PreparedQuery<
  IInsertUnvalidatedInputParams,
  IInsertUnvalidatedInputResult
>(insertUnvalidatedInputIR);

/** 'InsertValidatedInput' parameters type */
export interface IInsertValidatedInputParams {
  address_type: number;
  game_input: string;
  millisecond_timestamp: string;
  user_address: string;
  user_signature: string;
}

/** 'InsertValidatedInput' return type */
export type IInsertValidatedInputResult = void;

/** 'InsertValidatedInput' query type */
export interface IInsertValidatedInputQuery {
  params: IInsertValidatedInputParams;
  result: IInsertValidatedInputResult;
}

const insertValidatedInputIR: any = {
  usedParamSet: {
    address_type: true,
    user_address: true,
    game_input: true,
    millisecond_timestamp: true,
    user_signature: true,
  },
  params: [
    {
      name: 'address_type',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 136, b: 149 }],
    },
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 154, b: 167 }],
    },
    {
      name: 'game_input',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 172, b: 183 }],
    },
    {
      name: 'millisecond_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 188, b: 210 }],
    },
    {
      name: 'user_signature',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 215, b: 230 }],
    },
  ],
  statement:
    'INSERT INTO validated_game_inputs(\n  address_type,\n  user_address,\n  game_input,\n  millisecond_timestamp,\n  user_signature\n) VALUES (\n  :address_type!,\n  :user_address!,\n  :game_input!,\n  :millisecond_timestamp!,\n  :user_signature!\n)',
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO validated_game_inputs(
 *   address_type,
 *   user_address,
 *   game_input,
 *   millisecond_timestamp,
 *   user_signature
 * ) VALUES (
 *   :address_type!,
 *   :user_address!,
 *   :game_input!,
 *   :millisecond_timestamp!,
 *   :user_signature!
 * )
 * ```
 */
export const insertValidatedInput = new PreparedQuery<
  IInsertValidatedInputParams,
  IInsertValidatedInputResult
>(insertValidatedInputIR);

/** 'GetUnvalidatedInputs' parameters type */
export type IGetUnvalidatedInputsParams = void;

/** 'GetUnvalidatedInputs' return type */
export interface IGetUnvalidatedInputsResult {
  address_type: number;
  game_input: string;
  id: number;
  millisecond_timestamp: string;
  user_address: string;
  user_signature: string;
}

/** 'GetUnvalidatedInputs' query type */
export interface IGetUnvalidatedInputsQuery {
  params: IGetUnvalidatedInputsParams;
  result: IGetUnvalidatedInputsResult;
}

const getUnvalidatedInputsIR: any = {
  usedParamSet: {},
  params: [],
  statement: 'SELECT * FROM unvalidated_game_inputs',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM unvalidated_game_inputs
 * ```
 */
export const getUnvalidatedInputs = new PreparedQuery<
  IGetUnvalidatedInputsParams,
  IGetUnvalidatedInputsResult
>(getUnvalidatedInputsIR);

/** 'ValidateInput' parameters type */
export interface IValidateInputParams {
  id: number;
}

/** 'ValidateInput' return type */
export type IValidateInputResult = void;

/** 'ValidateInput' query type */
export interface IValidateInputQuery {
  params: IValidateInputParams;
  result: IValidateInputResult;
}

const validateInputIR: any = {
  usedParamSet: { id: true },
  params: [{ name: 'id', required: true, transform: { type: 'scalar' }, locs: [{ a: 60, b: 63 }] }],
  statement:
    'WITH res AS (DELETE FROM unvalidated_game_inputs WHERE id = :id! RETURNING address_type, user_address, game_input, millisecond_timestamp, user_signature)\n    INSERT INTO validated_game_inputs (address_type, user_address, game_input, millisecond_timestamp, user_signature) SELECT * FROM res',
};

/**
 * Query generated from SQL:
 * ```
 * WITH res AS (DELETE FROM unvalidated_game_inputs WHERE id = :id! RETURNING address_type, user_address, game_input, millisecond_timestamp, user_signature)
 *     INSERT INTO validated_game_inputs (address_type, user_address, game_input, millisecond_timestamp, user_signature) SELECT * FROM res
 * ```
 */
export const validateInput = new PreparedQuery<IValidateInputParams, IValidateInputResult>(
  validateInputIR
);

/** 'DeleteUnvalidatedInput' parameters type */
export interface IDeleteUnvalidatedInputParams {
  id: number;
}

/** 'DeleteUnvalidatedInput' return type */
export type IDeleteUnvalidatedInputResult = void;

/** 'DeleteUnvalidatedInput' query type */
export interface IDeleteUnvalidatedInputQuery {
  params: IDeleteUnvalidatedInputParams;
  result: IDeleteUnvalidatedInputResult;
}

const deleteUnvalidatedInputIR: any = {
  usedParamSet: { id: true },
  params: [{ name: 'id', required: true, transform: { type: 'scalar' }, locs: [{ a: 47, b: 50 }] }],
  statement: 'DELETE FROM unvalidated_game_inputs\nWHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM unvalidated_game_inputs
 * WHERE id = :id!
 * ```
 */
export const deleteUnvalidatedInput = new PreparedQuery<
  IDeleteUnvalidatedInputParams,
  IDeleteUnvalidatedInputResult
>(deleteUnvalidatedInputIR);

/** 'InsertStateValidating' parameters type */
export interface IInsertStateValidatingParams {
  input_hash: string;
}

/** 'InsertStateValidating' return type */
export type IInsertStateValidatingResult = void;

/** 'InsertStateValidating' query type */
export interface IInsertStateValidatingQuery {
  params: IInsertStateValidatingParams;
  result: IInsertStateValidatingResult;
}

const insertStateValidatingIR: any = {
  usedParamSet: { input_hash: true },
  params: [
    { name: 'input_hash', required: true, transform: { type: 'scalar' }, locs: [{ a: 87, b: 98 }] },
  ],
  statement:
    "INSERT INTO input_states(\n  input_hash,\n  current_state,\n  rejection_code\n) VALUES (\n  :input_hash!,\n  'validating',\n  0\n)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO input_states(
 *   input_hash,
 *   current_state,
 *   rejection_code
 * ) VALUES (
 *   :input_hash!,
 *   'validating',
 *   0
 * )
 * ```
 */
export const insertStateValidating = new PreparedQuery<
  IInsertStateValidatingParams,
  IInsertStateValidatingResult
>(insertStateValidatingIR);

/** 'InsertStateRejected' parameters type */
export interface IInsertStateRejectedParams {
  input_hash: string;
  rejection_code: number;
}

/** 'InsertStateRejected' return type */
export type IInsertStateRejectedResult = void;

/** 'InsertStateRejected' query type */
export interface IInsertStateRejectedQuery {
  params: IInsertStateRejectedParams;
  result: IInsertStateRejectedResult;
}

const insertStateRejectedIR: any = {
  usedParamSet: { input_hash: true, rejection_code: true },
  params: [
    { name: 'input_hash', required: true, transform: { type: 'scalar' }, locs: [{ a: 87, b: 98 }] },
    {
      name: 'rejection_code',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 117, b: 132 }],
    },
  ],
  statement:
    "INSERT INTO input_states(\n  input_hash,\n  current_state,\n  rejection_code\n) VALUES (\n  :input_hash!,\n  'rejected',\n  :rejection_code!\n)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO input_states(
 *   input_hash,
 *   current_state,
 *   rejection_code
 * ) VALUES (
 *   :input_hash!,
 *   'rejected',
 *   :rejection_code!
 * )
 * ```
 */
export const insertStateRejected = new PreparedQuery<
  IInsertStateRejectedParams,
  IInsertStateRejectedResult
>(insertStateRejectedIR);

/** 'InsertStateAccepted' parameters type */
export interface IInsertStateAcceptedParams {
  input_hash: string;
}

/** 'InsertStateAccepted' return type */
export type IInsertStateAcceptedResult = void;

/** 'InsertStateAccepted' query type */
export interface IInsertStateAcceptedQuery {
  params: IInsertStateAcceptedParams;
  result: IInsertStateAcceptedResult;
}

const insertStateAcceptedIR: any = {
  usedParamSet: { input_hash: true },
  params: [
    { name: 'input_hash', required: true, transform: { type: 'scalar' }, locs: [{ a: 87, b: 98 }] },
  ],
  statement:
    "INSERT INTO input_states(\n  input_hash,\n  current_state,\n  rejection_code\n) VALUES (\n  :input_hash!,\n  'accepted',\n  0\n)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO input_states(
 *   input_hash,
 *   current_state,
 *   rejection_code
 * ) VALUES (
 *   :input_hash!,
 *   'accepted',
 *   0
 * )
 * ```
 */
export const insertStateAccepted = new PreparedQuery<
  IInsertStateAcceptedParams,
  IInsertStateAcceptedResult
>(insertStateAcceptedIR);

/** 'UpdateStateAccepted' parameters type */
export interface IUpdateStateAcceptedParams {
  input_hash: string;
}

/** 'UpdateStateAccepted' return type */
export type IUpdateStateAcceptedResult = void;

/** 'UpdateStateAccepted' query type */
export interface IUpdateStateAcceptedQuery {
  params: IUpdateStateAcceptedParams;
  result: IUpdateStateAcceptedResult;
}

const updateStateAcceptedIR: any = {
  usedParamSet: { input_hash: true },
  params: [
    { name: 'input_hash', required: true, transform: { type: 'scalar' }, locs: [{ a: 74, b: 85 }] },
  ],
  statement:
    "UPDATE input_states\nSET\n    current_state = 'accepted'\nWHERE input_hash = :input_hash!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE input_states
 * SET
 *     current_state = 'accepted'
 * WHERE input_hash = :input_hash!
 * ```
 */
export const updateStateAccepted = new PreparedQuery<
  IUpdateStateAcceptedParams,
  IUpdateStateAcceptedResult
>(updateStateAcceptedIR);

/** 'UpdateStateRejected' parameters type */
export interface IUpdateStateRejectedParams {
  input_hash: string;
  rejection_code: number;
}

/** 'UpdateStateRejected' return type */
export type IUpdateStateRejectedResult = void;

/** 'UpdateStateRejected' query type */
export interface IUpdateStateRejectedQuery {
  params: IUpdateStateRejectedParams;
  result: IUpdateStateRejectedResult;
}

const updateStateRejectedIR: any = {
  usedParamSet: { rejection_code: true, input_hash: true },
  params: [
    {
      name: 'rejection_code',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 77, b: 92 }],
    },
    {
      name: 'input_hash',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 113, b: 124 }],
    },
  ],
  statement:
    "UPDATE input_states\nSET\n    current_state = 'rejected',\n    rejection_code = :rejection_code!\nWHERE input_hash = :input_hash!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE input_states
 * SET
 *     current_state = 'rejected',
 *     rejection_code = :rejection_code!
 * WHERE input_hash = :input_hash!
 * ```
 */
export const updateStateRejected = new PreparedQuery<
  IUpdateStateRejectedParams,
  IUpdateStateRejectedResult
>(updateStateRejectedIR);

/** 'UpdateStatePosted' parameters type */
export interface IUpdateStatePostedParams {
  block_height: number;
  input_hash: string;
  transaction_hash: string | null | void;
}

/** 'UpdateStatePosted' return type */
export type IUpdateStatePostedResult = void;

/** 'UpdateStatePosted' query type */
export interface IUpdateStatePostedQuery {
  params: IUpdateStatePostedParams;
  result: IUpdateStatePostedResult;
}

const updateStatePostedIR: any = {
  usedParamSet: { block_height: true, transaction_hash: true, input_hash: true },
  params: [
    {
      name: 'block_height',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 73, b: 86 }],
    },
    {
      name: 'transaction_hash',
      required: false,
      transform: { type: 'scalar' },
      locs: [{ a: 112, b: 128 }],
    },
    {
      name: 'input_hash',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 149, b: 160 }],
    },
  ],
  statement:
    "UPDATE input_states\nSET\n    current_state = 'posted',\n    block_height = :block_height!,\n    transaction_hash = :transaction_hash\nWHERE input_hash = :input_hash!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE input_states
 * SET
 *     current_state = 'posted',
 *     block_height = :block_height!,
 *     transaction_hash = :transaction_hash
 * WHERE input_hash = :input_hash!
 * ```
 */
export const updateStatePosted = new PreparedQuery<
  IUpdateStatePostedParams,
  IUpdateStatePostedResult
>(updateStatePostedIR);

/** 'GetInputState' parameters type */
export interface IGetInputStateParams {
  input_hash: string;
}

/** 'GetInputState' return type */
export interface IGetInputStateResult {
  block_height: number | null;
  current_state: input_state;
  input_hash: string;
  rejection_code: number | null;
  transaction_hash: string | null;
}

/** 'GetInputState' query type */
export interface IGetInputStateQuery {
  params: IGetInputStateParams;
  result: IGetInputStateResult;
}

const getInputStateIR: any = {
  usedParamSet: { input_hash: true },
  params: [
    { name: 'input_hash', required: true, transform: { type: 'scalar' }, locs: [{ a: 46, b: 57 }] },
  ],
  statement: 'SELECT * FROM input_states\nWHERE input_hash = :input_hash!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM input_states
 * WHERE input_hash = :input_hash!
 * ```
 */
export const getInputState = new PreparedQuery<IGetInputStateParams, IGetInputStateResult>(
  getInputStateIR
);

/** 'GetValidatedInputs' parameters type */
export type IGetValidatedInputsParams = void;

/** 'GetValidatedInputs' return type */
export interface IGetValidatedInputsResult {
  address_type: number;
  game_input: string;
  id: number;
  millisecond_timestamp: string;
  user_address: string;
  user_signature: string;
}

/** 'GetValidatedInputs' query type */
export interface IGetValidatedInputsQuery {
  params: IGetValidatedInputsParams;
  result: IGetValidatedInputsResult;
}

const getValidatedInputsIR: any = {
  usedParamSet: {},
  params: [],
  statement: 'SELECT * FROM validated_game_inputs',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM validated_game_inputs
 * ```
 */
export const getValidatedInputs = new PreparedQuery<
  IGetValidatedInputsParams,
  IGetValidatedInputsResult
>(getValidatedInputsIR);

/** 'DeleteValidatedInput' parameters type */
export interface IDeleteValidatedInputParams {
  id: number;
}

/** 'DeleteValidatedInput' return type */
export type IDeleteValidatedInputResult = void;

/** 'DeleteValidatedInput' query type */
export interface IDeleteValidatedInputQuery {
  params: IDeleteValidatedInputParams;
  result: IDeleteValidatedInputResult;
}

const deleteValidatedInputIR: any = {
  usedParamSet: { id: true },
  params: [{ name: 'id', required: true, transform: { type: 'scalar' }, locs: [{ a: 45, b: 48 }] }],
  statement: 'DELETE FROM validated_game_inputs\nWHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM validated_game_inputs
 * WHERE id = :id!
 * ```
 */
export const deleteValidatedInput = new PreparedQuery<
  IDeleteValidatedInputParams,
  IDeleteValidatedInputResult
>(deleteValidatedInputIR);

/** 'GetUserTrackingEntry' parameters type */
export interface IGetUserTrackingEntryParams {
  user_address: string;
}

/** 'GetUserTrackingEntry' return type */
export interface IGetUserTrackingEntryResult {
  inputs_day: number;
  inputs_minute: number;
  inputs_total: number;
  latest_timestamp: Date;
  user_address: string;
}

/** 'GetUserTrackingEntry' query type */
export interface IGetUserTrackingEntryQuery {
  params: IGetUserTrackingEntryParams;
  result: IGetUserTrackingEntryResult;
}

const getUserTrackingEntryIR: any = {
  usedParamSet: { user_address: true },
  params: [
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 49, b: 62 }],
    },
  ],
  statement: 'SELECT * FROM user_tracking\nWHERE user_address = :user_address!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM user_tracking
 * WHERE user_address = :user_address!
 * ```
 */
export const getUserTrackingEntry = new PreparedQuery<
  IGetUserTrackingEntryParams,
  IGetUserTrackingEntryResult
>(getUserTrackingEntryIR);

/** 'AddUserTrackingEntry' parameters type */
export interface IAddUserTrackingEntryParams {
  current_timestamp: Date;
  user_address: string;
}

/** 'AddUserTrackingEntry' return type */
export type IAddUserTrackingEntryResult = void;

/** 'AddUserTrackingEntry' query type */
export interface IAddUserTrackingEntryQuery {
  params: IAddUserTrackingEntryParams;
  result: IAddUserTrackingEntryResult;
}

const addUserTrackingEntryIR: any = {
  usedParamSet: { user_address: true, current_timestamp: true },
  params: [
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 122, b: 135 }],
    },
    {
      name: 'current_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 140, b: 158 }],
    },
  ],
  statement:
    'INSERT INTO user_tracking(\n  user_address,\n  latest_timestamp,\n  inputs_minute,\n  inputs_day,\n  inputs_total\n) VALUES (\n  :user_address!,\n  :current_timestamp!,\n  1,\n  1,\n  1\n)',
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_tracking(
 *   user_address,
 *   latest_timestamp,
 *   inputs_minute,
 *   inputs_day,
 *   inputs_total
 * ) VALUES (
 *   :user_address!,
 *   :current_timestamp!,
 *   1,
 *   1,
 *   1
 * )
 * ```
 */
export const addUserTrackingEntry = new PreparedQuery<
  IAddUserTrackingEntryParams,
  IAddUserTrackingEntryResult
>(addUserTrackingEntryIR);

/** 'IncrementUserTrackingSameMinute' parameters type */
export interface IIncrementUserTrackingSameMinuteParams {
  current_timestamp: Date;
  user_address: string;
}

/** 'IncrementUserTrackingSameMinute' return type */
export type IIncrementUserTrackingSameMinuteResult = void;

/** 'IncrementUserTrackingSameMinute' query type */
export interface IIncrementUserTrackingSameMinuteQuery {
  params: IIncrementUserTrackingSameMinuteParams;
  result: IIncrementUserTrackingSameMinuteResult;
}

const incrementUserTrackingSameMinuteIR: any = {
  usedParamSet: { current_timestamp: true, user_address: true },
  params: [
    {
      name: 'current_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 48, b: 66 }],
    },
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 198, b: 211 }],
    },
  ],
  statement:
    'UPDATE user_tracking\nSET\n    latest_timestamp = :current_timestamp!,\n    inputs_minute = inputs_minute + 1,\n    inputs_day = inputs_day + 1,\n    inputs_total = inputs_total + 1\nWHERE user_address = :user_address!',
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_tracking
 * SET
 *     latest_timestamp = :current_timestamp!,
 *     inputs_minute = inputs_minute + 1,
 *     inputs_day = inputs_day + 1,
 *     inputs_total = inputs_total + 1
 * WHERE user_address = :user_address!
 * ```
 */
export const incrementUserTrackingSameMinute = new PreparedQuery<
  IIncrementUserTrackingSameMinuteParams,
  IIncrementUserTrackingSameMinuteResult
>(incrementUserTrackingSameMinuteIR);

/** 'IncrementUserTrackingSameDay' parameters type */
export interface IIncrementUserTrackingSameDayParams {
  current_timestamp: Date;
  user_address: string;
}

/** 'IncrementUserTrackingSameDay' return type */
export type IIncrementUserTrackingSameDayResult = void;

/** 'IncrementUserTrackingSameDay' query type */
export interface IIncrementUserTrackingSameDayQuery {
  params: IIncrementUserTrackingSameDayParams;
  result: IIncrementUserTrackingSameDayResult;
}

const incrementUserTrackingSameDayIR: any = {
  usedParamSet: { current_timestamp: true, user_address: true },
  params: [
    {
      name: 'current_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 48, b: 66 }],
    },
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 182, b: 195 }],
    },
  ],
  statement:
    'UPDATE user_tracking\nSET\n    latest_timestamp = :current_timestamp!,\n    inputs_minute = 1,\n    inputs_day = inputs_day + 1,\n    inputs_total = inputs_total + 1\nWHERE user_address = :user_address!',
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_tracking
 * SET
 *     latest_timestamp = :current_timestamp!,
 *     inputs_minute = 1,
 *     inputs_day = inputs_day + 1,
 *     inputs_total = inputs_total + 1
 * WHERE user_address = :user_address!
 * ```
 */
export const incrementUserTrackingSameDay = new PreparedQuery<
  IIncrementUserTrackingSameDayParams,
  IIncrementUserTrackingSameDayResult
>(incrementUserTrackingSameDayIR);

/** 'IncrementUserTrackingAnotherDay' parameters type */
export interface IIncrementUserTrackingAnotherDayParams {
  current_timestamp: Date;
  user_address: string;
}

/** 'IncrementUserTrackingAnotherDay' return type */
export type IIncrementUserTrackingAnotherDayResult = void;

/** 'IncrementUserTrackingAnotherDay' query type */
export interface IIncrementUserTrackingAnotherDayQuery {
  params: IIncrementUserTrackingAnotherDayParams;
  result: IIncrementUserTrackingAnotherDayResult;
}

const incrementUserTrackingAnotherDayIR: any = {
  usedParamSet: { current_timestamp: true, user_address: true },
  params: [
    {
      name: 'current_timestamp',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 48, b: 66 }],
    },
    {
      name: 'user_address',
      required: true,
      transform: { type: 'scalar' },
      locs: [{ a: 169, b: 182 }],
    },
  ],
  statement:
    'UPDATE user_tracking\nSET\n    latest_timestamp = :current_timestamp!,\n    inputs_minute = 1,\n    inputs_day = 1,\n    inputs_total = inputs_total + 1\nWHERE user_address = :user_address!',
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_tracking
 * SET
 *     latest_timestamp = :current_timestamp!,
 *     inputs_minute = 1,
 *     inputs_day = 1,
 *     inputs_total = inputs_total + 1
 * WHERE user_address = :user_address!
 * ```
 */
export const incrementUserTrackingAnotherDay = new PreparedQuery<
  IIncrementUserTrackingAnotherDayParams,
  IIncrementUserTrackingAnotherDayResult
>(incrementUserTrackingAnotherDayIR);
