export declare enum EncodingVersion {
  V1 = 0,
}
export declare type HexString = string;
export declare type UTF8String = string;
export declare type InputString = HexString | UTF8String;
export declare type ConciseValue = {
  value: string;
  isStateIdentifier?: boolean;
};
export declare type ConciseBuilderInitializer = {
  initialize: (input?: InputString, version?: EncodingVersion) => ConciseBuilder;
};
export declare type ConciseBuilder = {
  initialConciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];
  setPrefix: (prefix: UTF8String) => void;
  addValue: (value: ConciseValue) => void;
  build: () => UTF8String;
  initialInput: () => UTF8String;
  insertValue: (position: number, value: ConciseValue) => void;
  addValues: (values: ConciseValue[]) => void;
  valueCount: () => number;
};
export declare type ConciseConsumerInitializer = {
  initialize: (input: InputString, version?: EncodingVersion) => ConciseConsumer;
};
export declare type ConciseConsumer = {
  conciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];
  prefix: () => string;
  stateIdentifiers: () => ConciseValue[];
  nextValue: () => ConciseValue | '';
  popValue: () => ConciseValue | '';
  initialInput: (decompress?: boolean) => UTF8String;
  readValue: (position: number) => ConciseValue | '';
  valueCount: () => number;
};
