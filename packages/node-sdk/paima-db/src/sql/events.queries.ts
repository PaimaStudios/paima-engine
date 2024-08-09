/** Types generated for queries found in "src/sql/events.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'GetEvents' parameters type */
export interface IGetEventsParams {
  address?: string | null | void;
  field0?: string | null | void;
  field1?: string | null | void;
  field2?: string | null | void;
  field3?: string | null | void;
  field4?: string | null | void;
  field5?: string | null | void;
  field6?: string | null | void;
  field7?: string | null | void;
  field8?: string | null | void;
  field9?: string | null | void;
  from?: number | null | void;
  to?: number | null | void;
  topic: string;
  value0?: string | null | void;
  value1?: string | null | void;
  value2?: string | null | void;
  value3?: string | null | void;
  value4?: string | null | void;
  value5?: string | null | void;
  value6?: string | null | void;
  value7?: string | null | void;
  value8?: string | null | void;
  value9?: string | null | void;
}

/** 'GetEvents' return type */
export interface IGetEventsResult {
  address: string;
  block_height: number;
  data: Json;
  id: number;
  idx: number;
  topic: string;
  tx: number;
}

/** 'GetEvents' query type */
export interface IGetEventsQuery {
  params: IGetEventsParams;
  result: IGetEventsResult;
}

const getEventsIR: any = {"usedParamSet":{"field0":true,"value0":true,"field1":true,"value1":true,"field2":true,"value2":true,"field3":true,"value3":true,"field4":true,"value4":true,"field5":true,"value5":true,"field6":true,"value6":true,"field7":true,"value7":true,"field8":true,"value8":true,"field9":true,"value9":true,"from":true,"to":true,"address":true,"topic":true},"params":[{"name":"field0","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":50}]},{"name":"value0","required":false,"transform":{"type":"scalar"},"locs":[{"a":54,"b":60}]},{"name":"field1","required":false,"transform":{"type":"scalar"},"locs":[{"a":90,"b":96}]},{"name":"value1","required":false,"transform":{"type":"scalar"},"locs":[{"a":100,"b":106}]},{"name":"field2","required":false,"transform":{"type":"scalar"},"locs":[{"a":136,"b":142}]},{"name":"value2","required":false,"transform":{"type":"scalar"},"locs":[{"a":146,"b":152}]},{"name":"field3","required":false,"transform":{"type":"scalar"},"locs":[{"a":182,"b":188}]},{"name":"value3","required":false,"transform":{"type":"scalar"},"locs":[{"a":192,"b":198}]},{"name":"field4","required":false,"transform":{"type":"scalar"},"locs":[{"a":228,"b":234}]},{"name":"value4","required":false,"transform":{"type":"scalar"},"locs":[{"a":238,"b":244}]},{"name":"field5","required":false,"transform":{"type":"scalar"},"locs":[{"a":274,"b":280}]},{"name":"value5","required":false,"transform":{"type":"scalar"},"locs":[{"a":284,"b":290}]},{"name":"field6","required":false,"transform":{"type":"scalar"},"locs":[{"a":320,"b":326}]},{"name":"value6","required":false,"transform":{"type":"scalar"},"locs":[{"a":330,"b":336}]},{"name":"field7","required":false,"transform":{"type":"scalar"},"locs":[{"a":366,"b":372}]},{"name":"value7","required":false,"transform":{"type":"scalar"},"locs":[{"a":376,"b":382}]},{"name":"field8","required":false,"transform":{"type":"scalar"},"locs":[{"a":412,"b":418}]},{"name":"value8","required":false,"transform":{"type":"scalar"},"locs":[{"a":422,"b":428}]},{"name":"field9","required":false,"transform":{"type":"scalar"},"locs":[{"a":458,"b":464}]},{"name":"value9","required":false,"transform":{"type":"scalar"},"locs":[{"a":468,"b":474}]},{"name":"from","required":false,"transform":{"type":"scalar"},"locs":[{"a":513,"b":517}]},{"name":"to","required":false,"transform":{"type":"scalar"},"locs":[{"a":556,"b":558}]},{"name":"address","required":false,"transform":{"type":"scalar"},"locs":[{"a":591,"b":598}]},{"name":"topic","required":true,"transform":{"type":"scalar"},"locs":[{"a":620,"b":626}]}],"statement":"SELECT * FROM event WHERE\n  COALESCE(data->>:field0 = :value0, 1=1) AND\n  COALESCE(data->>:field1 = :value1, 1=1) AND\n  COALESCE(data->>:field2 = :value2, 1=1) AND\n  COALESCE(data->>:field3 = :value3, 1=1) AND\n  COALESCE(data->>:field4 = :value4, 1=1) AND\n  COALESCE(data->>:field5 = :value5, 1=1) AND\n  COALESCE(data->>:field6 = :value6, 1=1) AND\n  COALESCE(data->>:field7 = :value7, 1=1) AND\n  COALESCE(data->>:field8 = :value8, 1=1) AND\n  COALESCE(data->>:field9 = :value9, 1=1) AND\n  COALESCE(block_height >= :from, 1=1) AND\n  COALESCE(block_height <= :to, 1=1) AND\n  COALESCE(address = :address, 1=1) AND\n  topic = :topic!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM event WHERE
 *   COALESCE(data->>:field0 = :value0, 1=1) AND
 *   COALESCE(data->>:field1 = :value1, 1=1) AND
 *   COALESCE(data->>:field2 = :value2, 1=1) AND
 *   COALESCE(data->>:field3 = :value3, 1=1) AND
 *   COALESCE(data->>:field4 = :value4, 1=1) AND
 *   COALESCE(data->>:field5 = :value5, 1=1) AND
 *   COALESCE(data->>:field6 = :value6, 1=1) AND
 *   COALESCE(data->>:field7 = :value7, 1=1) AND
 *   COALESCE(data->>:field8 = :value8, 1=1) AND
 *   COALESCE(data->>:field9 = :value9, 1=1) AND
 *   COALESCE(block_height >= :from, 1=1) AND
 *   COALESCE(block_height <= :to, 1=1) AND
 *   COALESCE(address = :address, 1=1) AND
 *   topic = :topic!
 * ```
 */
export const getEvents = new PreparedQuery<IGetEventsParams,IGetEventsResult>(getEventsIR);


/** 'InsertEvent' parameters type */
export interface IInsertEventParams {
  address: string;
  block_height: number;
  data: Json;
  idx: number;
  topic: string;
  tx: number;
}

/** 'InsertEvent' return type */
export type IInsertEventResult = void;

/** 'InsertEvent' query type */
export interface IInsertEventQuery {
  params: IInsertEventParams;
  result: IInsertEventResult;
}

const insertEventIR: any = {"usedParamSet":{"topic":true,"address":true,"data":true,"block_height":true,"tx":true,"idx":true},"params":[{"name":"topic","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":95}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":100,"b":108}]},{"name":"data","required":true,"transform":{"type":"scalar"},"locs":[{"a":113,"b":118}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":123,"b":136}]},{"name":"tx","required":true,"transform":{"type":"scalar"},"locs":[{"a":141,"b":144}]},{"name":"idx","required":true,"transform":{"type":"scalar"},"locs":[{"a":149,"b":153}]}],"statement":"INSERT INTO event (\n  topic,\n  address,\n  data,\n  block_height,\n  tx,\n  idx\n) VALUES (\n  :topic!,\n  :address!,\n  :data!,\n  :block_height!,\n  :tx!,\n  :idx!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO event (
 *   topic,
 *   address,
 *   data,
 *   block_height,
 *   tx,
 *   idx
 * ) VALUES (
 *   :topic!,
 *   :address!,
 *   :data!,
 *   :block_height!,
 *   :tx!,
 *   :idx!
 * )
 * ```
 */
export const insertEvent = new PreparedQuery<IInsertEventParams,IInsertEventResult>(insertEventIR);


/** 'RegisterEventType' parameters type */
export interface IRegisterEventTypeParams {
  name: string;
  topic: string;
}

/** 'RegisterEventType' return type */
export type IRegisterEventTypeResult = void;

/** 'RegisterEventType' query type */
export interface IRegisterEventTypeQuery {
  params: IRegisterEventTypeParams;
  result: IRegisterEventTypeResult;
}

const registerEventTypeIR: any = {"usedParamSet":{"name":true,"topic":true},"params":[{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":60,"b":65}]},{"name":"topic","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":76}]}],"statement":"INSERT INTO registered_event (\n  name,\n  topic\n) VALUES (\n  :name!,\n  :topic!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO registered_event (
 *   name,
 *   topic
 * ) VALUES (
 *   :name!,
 *   :topic!
 * )
 * ```
 */
export const registerEventType = new PreparedQuery<IRegisterEventTypeParams,IRegisterEventTypeResult>(registerEventTypeIR);


/** 'GetTopicsForEvent' parameters type */
export interface IGetTopicsForEventParams {
  name: string;
}

/** 'GetTopicsForEvent' return type */
export interface IGetTopicsForEventResult {
  topic: string;
}

/** 'GetTopicsForEvent' query type */
export interface IGetTopicsForEventQuery {
  params: IGetTopicsForEventParams;
  result: IGetTopicsForEventResult;
}

const getTopicsForEventIR: any = {"usedParamSet":{"name":true},"params":[{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":53}]}],"statement":"SELECT topic FROM registered_event WHERE name = :name!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT topic FROM registered_event WHERE name = :name!
 * ```
 */
export const getTopicsForEvent = new PreparedQuery<IGetTopicsForEventParams,IGetTopicsForEventResult>(getTopicsForEventIR);


/** 'GetTopics' parameters type */
export type IGetTopicsParams = void;

/** 'GetTopics' return type */
export interface IGetTopicsResult {
  name: string;
  topic: string;
}

/** 'GetTopics' query type */
export interface IGetTopicsQuery {
  params: IGetTopicsParams;
  result: IGetTopicsResult;
}

const getTopicsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT name, topic FROM registered_event"};

/**
 * Query generated from SQL:
 * ```
 * SELECT name, topic FROM registered_event
 * ```
 */
export const getTopics = new PreparedQuery<IGetTopicsParams,IGetTopicsResult>(getTopicsIR);


/** 'GetEventByTopic' parameters type */
export interface IGetEventByTopicParams {
  topic: string;
}

/** 'GetEventByTopic' return type */
export interface IGetEventByTopicResult {
  name: string;
}

/** 'GetEventByTopic' query type */
export interface IGetEventByTopicQuery {
  params: IGetEventByTopicParams;
  result: IGetEventByTopicResult;
}

const getEventByTopicIR: any = {"usedParamSet":{"topic":true},"params":[{"name":"topic","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":54}]}],"statement":"SELECT name FROM registered_event WHERE topic = :topic!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT name FROM registered_event WHERE topic = :topic!
 * ```
 */
export const getEventByTopic = new PreparedQuery<IGetEventByTopicParams,IGetEventByTopicResult>(getEventByTopicIR);


