import { ENV } from '@paima/batcher-utils';
import type { ErrorCode, GameInputValidatorCore } from '@paima/batcher-utils';
import axios from 'axios';

type DefaultInputValidatorCore = GameInputValidatorCore;

export const DefaultInputValidatorCoreInitializator = {
  async initialize(): Promise<DefaultInputValidatorCore> {
    return {
      async validate(gameInput: string, userAddress: string): Promise<ErrorCode> {
        const url = `${ENV.GAME_NODE_URI}/dry_run`;
        const result = await axios.get<{ valid: boolean }>(url, {
          params: { gameInput, userAddress },
        });
        return result.data?.valid === true ? 0 : 1;
      },
    };
  },
};
