import { Controller, Query, Get, Route } from 'tsoa';
import { doLog, logError, ENV } from '@paima/utils';
import { EngineService } from '../EngineService.js';
import {
  deploymentChainBlockheightToEmulated,
  emulatedSelectLatestPrior,
  getGameInput,
} from '@paima/db';

export interface SuccessfulResult<T> {
  success: true;
  result: T;
}

export interface FailedResult {
  success: false;
  errorMessage: string;
  errorCode?: number;
}

export type Result<T> = SuccessfulResult<T> | FailedResult;

type DryRunResponse = { valid: boolean };

@Route('dry_run')
export class DryRunController extends Controller {
  @Get()
  public async get(
    @Query() gameInput: string,
    @Query() userAddress: string
  ): Promise<DryRunResponse> {
    if (!ENV.ENABLE_DRY_RUN) {
      this.setStatus(500);
    }
    doLog(`[Input Validation] ${gameInput} ${userAddress}`);
    const isValid = await EngineService.INSTANCE.getSM().dryRun(gameInput, userAddress);
    return {
      valid: isValid,
    };
  }
}

/**
 * tsoa doesn't support string interpolation in type names like `${number}`
 * But the real type of this is `${number}.${number}.${number}`
 * https://github.com/lukeautry/tsoa/pull/1469
 */
type VersionString = string;

@Route('backend_version')
export class VersionController extends Controller {
  @Get()
  public async get(): Promise<VersionString> {
    return ENV.GAME_NODE_VERSION;
  }
}

type LatestProcessedBlockheightResponse = { block_height: number };
@Route('latest_processed_blockheight')
export class LatestProcessedBlockheightController extends Controller {
  @Get()
  public async get(): Promise<LatestProcessedBlockheightResponse> {
    const blockHeight = await EngineService.INSTANCE.getSM().latestProcessedBlockHeight();

    return { block_height: blockHeight };
  }
}

type EmulatedBlockActiveResponse = { emulatedBlocksActive: boolean };
@Route('emulated_blocks_active')
export class EmulatedBlockActiveController extends Controller {
  @Get()
  public async get(): Promise<EmulatedBlockActiveResponse> {
    return { emulatedBlocksActive: ENV.EMULATED_BLOCKS };
  }
}

type DeploymentBlockheightToEmulatedResponse = Result<number>;
@Route('deployment_blockheight_to_emulated')
export class DeploymentBlockheightToEmulatedController extends Controller {
  @Get()
  public async get(
    @Query() deploymentBlockheight: number
  ): Promise<DeploymentBlockheightToEmulatedResponse> {
    const gameStateMachine = EngineService.INSTANCE.getSM();
    try {
      // The block may be onchain without being included in an emulated block yet
      // ex: waiting to see if there are other blocks that need to be bundled as part of the same emulated block
      const blockNotYet = -1;
      const DBConn = gameStateMachine.getReadonlyDbConn();

      const [latestBlock] = await emulatedSelectLatestPrior.run(
        // pass in the highest block count possible to get the latest block
        { emulated_block_height: 2147483647 },
        DBConn
      );

      if (latestBlock == null) {
        return {
          success: true,
          result: blockNotYet,
        };
      }

      // The block may be onchain without being included in an emulated block yet
      // ex: waiting to see if there are other blocks that need to be bundled as part of the same emulated block
      if (latestBlock.deployment_chain_block_height < deploymentBlockheight) {
        return {
          success: true,
          result: blockNotYet,
        };
      }

      const emulated = await deploymentChainBlockheightToEmulated.run(
        { deployment_chain_block_height: deploymentBlockheight },
        DBConn
      );
      const emulatedBlockheight = emulated.at(0)?.emulated_block_height;

      if (emulatedBlockheight == null) {
        this.setStatus(500);
        return {
          success: false,
          errorMessage: `Supplied blockheight ${deploymentBlockheight} not found in DB`,
        };
      }
      return {
        success: true,
        result: emulatedBlockheight,
      };
    } catch (err) {
      doLog(`Unexpected webserver error:`);
      logError(err);
      this.setStatus(500);
      return {
        success: false,
        errorMessage: 'Unknown error, please contact game node operator',
      };
    }
  }
}

type ConfirmInputAcceptanceResponse = Result<boolean>;
@Route('confirm_input_acceptance')
export class ConfirmInputAcceptanceController extends Controller {
  @Get()
  public async get(
    @Query() gameInput: string,
    @Query() userAddress: string,
    @Query() blockHeight: number
  ): Promise<ConfirmInputAcceptanceResponse> {
    const gameStateMachine = EngineService.INSTANCE.getSM();
    try {
      if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
        this.setStatus(500);
        return {
          success: false,
          errorMessage: 'Game input storing turned off in the game node',
        };
      }
      const DBConn = gameStateMachine.getReadonlyDbConn();
      const results = await getGameInput.run(
        {
          user_address: userAddress,
          block_height: blockHeight,
        },
        DBConn
      );
      for (const row of results) {
        if (row.input_data === gameInput) {
          return {
            success: true,
            result: true,
          };
        }
      }
      return {
        success: true,
        result: false,
      };
    } catch (err) {
      doLog(`Unexpected webserver error:`);
      logError(err);
      this.setStatus(500);
      return {
        success: false,
        errorMessage: 'Unknown error, please contact game node operator',
      };
    }
  }
}
