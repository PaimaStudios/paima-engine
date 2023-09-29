export type ErrorCode = number;

export type ErrorMessageFxn = (errorCode: ErrorCode) => string;

export interface GameInputValidatorCore {
  validate: (gameInput: string, userAddress: string) => Promise<ErrorCode>;
}

export const enum GenericRejectionCode {
  OK = 0,
  UNSUPPORTED_ADDRESS_TYPE = 1,
  INVALID_ADDRESS = 2,
  INVALID_SIGNATURE = 3,
  ADDRESS_NOT_ALLOWED = 4,

  INVALID_GAME_INPUT = 100,
}

export const enum GameInputValidatorCoreType {
  NO_VALIDATION,
  DEFAULT,
}
