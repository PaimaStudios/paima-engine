export enum EncodingVersion {
  V1,
}

export type HexString = string;
export type UTF8String = string;
export type InputString = HexString | UTF8String;

export type ConciseValue = {
  value: string;
  isStateIdentifier?: boolean;
};

export type ConciseBuilderInitializer = {
  initialize: (input?: InputString, version?: EncodingVersion) => ConciseBuilder;
};
export type ConciseBuilder = {
  initialConciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];

  setPrefix: (prefix: UTF8String) => void;
  addValue: (value: ConciseValue) => void;
  build: () => UTF8String;

  initialInput: () => UTF8String;
  // Positions start at 1
  insertValue: (position: number, value: ConciseValue) => void;
  addValues: (values: ConciseValue[]) => void;
  valueCount: () => number;
};

export type ConciseConsumerInitializer = {
  initialize: (input: InputString, version?: EncodingVersion) => ConciseConsumer;
};
export type ConciseConsumer = {
  conciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];

  prefix: () => string;
  stateIdentifiers: () => ConciseValue[];
  nextValue: () => ConciseValue | '';

  popValue: () => ConciseValue | '';
  initialInput: (decompress?: boolean) => UTF8String;
  // Positions start at 1
  readValue: (position: number) => ConciseValue | '';
  valueCount: () => number;
};
