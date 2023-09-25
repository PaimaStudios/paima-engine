import type { ErrorCode, GameInputValidatorCore } from '@paima/batcher-utils';

type EmptyInputValidatorCore = GameInputValidatorCore;

export const EmptyInputValidatorCoreInitializator = {
  async initialize(): Promise<EmptyInputValidatorCore> {
    return {
      async validate(_gameInput: string, _userAddress: string): Promise<ErrorCode> {
        return 0;
      },
    };
  },
};
