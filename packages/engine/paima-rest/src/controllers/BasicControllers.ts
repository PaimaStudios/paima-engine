import { Controller, Response, Query, Get, Route } from 'tsoa';
import { doLog, logError, ENV } from '@paima/utils';
import type {
  InternalServerErrorResult,
  FailedResult,
  Result,
  ValidateErrorResult,
} from '@paima/utils';
import { EngineService } from '../EngineService.js';
import {
  deploymentChainBlockheightToEmulated,
  emulatedSelectLatestPrior,
  getGameInput,
  getGameInputForBlock,
  getInputsForAddress,
  getInputsForBlock,
  getScheduledDataByBlockHeight,
} from '@paima/db';
import type { Pool } from 'pg';
import { StatusCodes } from 'http-status-codes';

// Note: if you ever get `No declarations found for referenced type` in this folder, try running `npx nx reset`

type DryRunResponse = { valid: boolean };

@Route('dry_run')
export class DryRunController extends Controller {
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get()
  public async get(
    @Query() gameInput: string,
    @Query() userAddress: string
  ): Promise<Result<DryRunResponse>> {
    if (!ENV.ENABLE_DRY_RUN) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      return {
        success: false,
        errorMessage: 'Dry run is disabled',
      };
    }
    doLog(`[Input Validation] ${gameInput} ${userAddress}`);
    const isValid = await EngineService.INSTANCE.getSM().dryRun(gameInput, userAddress);
    return {
      success: true,
      result: {
        valid: isValid,
      },
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
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get()
  public async get(): Promise<VersionString> {
    return ENV.GAME_NODE_VERSION;
  }
}

type LatestProcessedBlockheightResponse = { block_height: number };
@Route('latest_processed_blockheight')
export class LatestProcessedBlockheightController extends Controller {
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get()
  public async get(): Promise<LatestProcessedBlockheightResponse> {
    const blockHeight = await EngineService.INSTANCE.getSM().latestProcessedBlockHeight();

    return { block_height: blockHeight };
  }
}

type EmulatedBlockActiveResponse = { emulatedBlocksActive: boolean };
@Route('emulated_blocks_active')
export class EmulatedBlockActiveController extends Controller {
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
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
    @Response<FailedResult>(StatusCodes.NOT_FOUND)
    @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
    @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
    @Query()
    deploymentBlockheight: number
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
        this.setStatus(StatusCodes.NOT_FOUND);
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
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
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
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get()
  public async get(
    @Query() gameInput: string,
    @Query() userAddress: string,
    @Query() blockHeight: number
  ): Promise<ConfirmInputAcceptanceResponse> {
    const gameStateMachine = EngineService.INSTANCE.getSM();
    try {
      if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
        this.setStatus(StatusCodes.NOT_IMPLEMENTED);
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
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      return {
        success: false,
        errorMessage: 'Unknown error, please contact game node operator',
      };
    }
  }
}

type TransactionCountResponse = {
  scheduledData: number;
  gameInputs: number;
};

@Route('transaction_count')
export class TransactionCountController extends Controller {
  async fetchTxCount(
    fetch: (db: Pool) => Promise<
      {
        game_inputs: string;
        scheduled_data: string;
      }[]
    >
  ): Promise<Result<TransactionCountResponse>> {
    const gameStateMachine = EngineService.INSTANCE.getSM();
    try {
      if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
        this.setStatus(StatusCodes.NOT_IMPLEMENTED);
        return {
          success: false,
          errorMessage: 'Game input storing turned off in the game node',
        };
      }
      const DBConn = gameStateMachine.getReadonlyDbConn();
      const [total] = await fetch(DBConn);

      const result =
        total == null
          ? { scheduledData: 0, gameInputs: 0 }
          : {
              scheduledData: Number.parseInt(total.scheduled_data),
              gameInputs: Number.parseInt(total.game_inputs),
            };
      return {
        success: true,
        result,
      };
    } catch (err) {
      doLog(`Unexpected webserver error:`);
      logError(err);
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      return {
        success: false,
        errorMessage: 'Unknown error, please contact game node operator',
      };
    }
  }
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/blockHeight')
  public async blockHeight(
    @Query() blockHeight: number
  ): Promise<Result<TransactionCountResponse>> {
    return await this.fetchTxCount(db =>
      getInputsForBlock.run(
        {
          block_height: blockHeight,
        },
        db
      )
    );
  }

  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/address')
  public async get(
    @Query() address: string,
    @Query() blockHeight: number
  ): Promise<Result<TransactionCountResponse>> {
    return await this.fetchTxCount(db =>
      getInputsForAddress.run(
        {
          addr: address,
          block_height: blockHeight,
        },
        db
      )
    );
  }
}

type TransactionContentResponse = {
  // blockHash: string;
  blockNumber: number;
  // txHash: string;
  txIndex: number;
  inputData: string;
  from: string;
  // value: string;
  // nonce: string;
};

@Route('transaction_content')
export class TransactionContentController extends Controller {
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/blockNumberAndIndex')
  public async blockHeight(
    @Query() blockHeight: number,
    @Query() txIndex: number
  ): Promise<Result<TransactionContentResponse>> {
    if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      return {
        success: false,
        errorMessage: 'Game input storing turned off in the game node',
      };
    }
    const gameStateMachine = EngineService.INSTANCE.getSM();
    const DBConn = gameStateMachine.getReadonlyDbConn();
    const scheduledData = await getScheduledDataByBlockHeight.run(
      {
        block_height: blockHeight,
      },
      DBConn
    );
    // note: scheduled data always comes before submitted input in STF processing
    if (txIndex < scheduledData.length) {
      const finalTx = scheduledData[txIndex];

      // Primitives from the underlying chain don't have a clear "from" address
      // but precompiles do
      const from = finalTx.precompile == null ? '0x0' : finalTx.precompile;
      return {
        success: true,
        result: {
          // blockHash: string,
          blockNumber: finalTx.block_height,
          // txHash: string,
          txIndex: txIndex,
          inputData: finalTx.input_data,
          from,
          // value: string,
          // nonce: string,
        },
      };
    }
    const submittedInputs = await getGameInputForBlock.run(
      {
        block_height: blockHeight,
      },
      DBConn
    );

    const totalInputsInBlock = submittedInputs.length + scheduledData.length;
    if (txIndex >= totalInputsInBlock) {
      this.setStatus(StatusCodes.NOT_FOUND);
      let errorMsg = `Query for index ${txIndex}, but there were only ${totalInputsInBlock} inputs total for this block`;
      if (totalInputsInBlock === 0) {
        // ideally we would for-sure know if this block exists or not
        // but that would slow down the endpoint
        errorMsg += `. Are you sure block number ${blockHeight} exists?`;
      }
      return {
        success: false,
        errorMessage: errorMsg,
      };
    }

    {
      const finalTx = submittedInputs[txIndex - scheduledData.length];
      return {
        success: true,
        result: {
          // blockHash: string,
          blockNumber: finalTx.block_height,
          // txHash: string,
          txIndex: txIndex,
          inputData: finalTx.input_data,
          from: finalTx.user_address,
          // value: string,
          // nonce: string,
        },
      };
    }
  }
}
