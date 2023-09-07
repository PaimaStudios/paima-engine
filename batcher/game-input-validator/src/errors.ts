import { GameInputValidatorCoreType, GENERIC_ERROR_MESSAGES } from '@paima-batcher/utils';
import type { ErrorCode } from '@paima-batcher/utils';

function getSpecificErrors(validatorType: GameInputValidatorCoreType): Record<ErrorCode, string> {
  switch (validatorType) {
    case GameInputValidatorCoreType.DEFAULT:
      return {};
    case GameInputValidatorCoreType.NO_VALIDATION:
      return {};
    default:
      return {};
  }
}

export function getErrors(validatorType: GameInputValidatorCoreType): Record<ErrorCode, string> {
  return {
    ...GENERIC_ERROR_MESSAGES,
    ...getSpecificErrors(validatorType),
  };
}
