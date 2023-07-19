export enum EncodingVersion {
  EMPTY,
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
  initialize: (input?: InputString, gameName?: string, version?: EncodingVersion) => ConciseBuilder;
};
export type ConciseBuilder = {
  initialConciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];
  gameName: string | undefined;

  setPrefix: (prefix: UTF8String, implicitUserAddress?: boolean) => void;
  addValue: (value: ConciseValue) => void;
  build: () => UTF8String;

  initialInput: () => UTF8String;
  // Positions start at 1
  insertValue: (position: number, value: ConciseValue) => void;
  addValues: (values: ConciseValue[]) => void;
  valueCount: () => number;
};

export type ConciseConsumerInitializer = {
  initializeSpecific: (
    input: InputString,
    gameName: undefined | string,
    version: EncodingVersion
  ) => ConciseConsumer;
  initialize: (input: InputString, gameName?: string, version?: EncodingVersion) => ConciseConsumer;
};
export type ConciseConsumer = {
  conciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];
  prefix: () => string;
  stateIdentifiers: () => ConciseValue[];
  nextValue: () => ConciseValue | null;
  remainingValues: () => ConciseValue[];
  popValue: () => ConciseValue | null;
  initialInput: (decompress?: boolean) => UTF8String;
  // Positions start at 1
  readValue: (position: number) => ConciseValue | null;
  valueCount: () => number;
};

export type ConciseConsumerInternals = {
  conciseImplicitUser: boolean;
  conciseInput: string;
  concisePrefix: string;
  conciseValues: ConciseValue[];
};
