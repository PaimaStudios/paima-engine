import { Controller, Response, Query, Get, Route, Body, Post } from 'tsoa';
import { doLog, logError, ENV, strip0x } from '@paima/utils';
import type {
  InternalServerErrorResult,
  FailedResult,
  Result,
  ValidateErrorResult,
} from '@paima/utils';
import { EngineService } from '../EngineService.js';
import type {
  IGetEventsResult,
  IGetGameInputResultByTxHashResult,
  IGetLatestProcessedBlockHeightResult,
  IInsertGameInputResultParams,
} from '@paima/db';
import {
  deploymentChainBlockheightToEmulated,
  emulatedSelectLatestPrior,
  getBlockByHash,
  getBlockHeights,
  getGameInputResultByAddress,
  getGameInputResultByBlockHeight,
  getGameInputResultByTxHash,
  getInputsForAddress,
  getInputsForBlock,
  getInputsForBlockHash,
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
      const results = await getGameInputResultByAddress.run(
        {
          from_address: userAddress,
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
  submittedInputs: number;
};

@Route('transaction_count')
export class TransactionCountController extends Controller {
  async fetchTxCount(
    fetch: (db: Pool) => Promise<
      {
        submitted_inputs: string;
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
          ? { scheduledData: 0, submittedInputs: 0 }
          : {
              scheduledData: Number.parseInt(total.scheduled_data),
              submittedInputs: Number.parseInt(total.submitted_inputs),
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
  @Get('/blockHash')
  public async hash(@Query() blockHash: string): Promise<Result<TransactionCountResponse>> {
    return await this.fetchTxCount(db =>
      getInputsForBlockHash.run(
        {
          block_hash: Buffer.from(strip0x(blockHash), 'hex'),
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
  blockHash: string;
  blockNumber: number;
  txHash: string;
  txIndex: number;
  inputData: string;
  from: string;
  success: boolean;
  // value: string;
  // nonce: string;
};

@Route('transaction_content')
export class TransactionContentController extends Controller {
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/txHash')
  public async txHash(@Query() txHash: string): Promise<Result<TransactionContentResponse>> {
    if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      return {
        success: false,
        errorMessage: 'Game input storing turned off in the game node',
      };
    }
    const gameStateMachine = EngineService.INSTANCE.getSM();
    const DBConn = gameStateMachine.getReadonlyDbConn();

    const gameInputs = (
      await getGameInputResultByTxHash.run({ tx_hash: Buffer.from(strip0x(txHash), 'hex') }, DBConn)
    ).at(0);

    if (gameInputs != null) {
      return {
        success: true,
        result: parseRollupInput(gameInputs),
      };
    }

    this.setStatus(StatusCodes.NOT_FOUND);
    return {
      success: false,
      errorMessage: `No transaction found for hash ${txHash}`,
    };
  }

  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/blockHashAndIndex')
  public async blockHash(
    @Query() blockHash: string,
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

    const [block] = await getBlockByHash.run(
      {
        block_hash: Buffer.from(strip0x(blockHash), 'hex'),
      },
      DBConn
    );
    if (block == null) {
      this.setStatus(StatusCodes.NOT_FOUND);
      return {
        success: false,
        errorMessage: `Block not found for hash: ${blockHash}`,
      };
    }

    return await this.blockHeight(block.block_height, txIndex);
  }

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

    {
      const gameInput = await getGameInputResultByBlockHeight.run(
        {
          block_height: blockHeight,
        },
        DBConn
      );

      // note: scheduled data always comes before submitted input in STF processing
      const finalTx = gameInput.find(tx => tx.index_in_block === txIndex);
      if (finalTx == null) {
        this.setStatus(StatusCodes.NOT_FOUND);
        let errorMsg = `Query for index ${txIndex}, but there were ${gameInput.length} inputs total for this block`;
        if (gameInput.length === 0) {
          // ideally we would for-sure know if this block exists or not
          // but that would slow down the endpoint
          errorMsg += `. Are you sure block number ${blockHeight} exists?`;
        }
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      return {
        success: true,
        result: parseRollupInput(finalTx),
      };
    }
  }
}

type BlockContentResponse = {
  blockHash: string;
  prevBlockHash: null | string;
  msTimestamp: number;
  blockHeight: number;
  txs: string[] | TransactionContentResponse[];
};

@Route('block_content')
export class BlockContentController extends Controller {
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/blockHash')
  public async blockHash(
    @Query() blockHash: string,
    @Query() txDetails: 'none' | 'hash' | 'full'
  ): Promise<Result<BlockContentResponse>> {
    if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      return {
        success: false,
        errorMessage: 'Game input storing turned off in the game node',
      };
    }
    const gameStateMachine = EngineService.INSTANCE.getSM();
    const DBConn = gameStateMachine.getReadonlyDbConn();

    const [block] = await getBlockByHash.run(
      {
        block_hash: Buffer.from(strip0x(blockHash), 'hex'),
      },
      DBConn
    );
    if (block == null) {
      this.setStatus(StatusCodes.NOT_FOUND);
      return {
        success: false,
        errorMessage: `Block not found for hash: ${blockHash}`,
      };
    }

    const gameInputs = await getGameInputResultByBlockHeight.run(
      {
        block_height: block.block_height,
      },
      DBConn
    );
    const txs = ((): [] | string[] | ReturnType<typeof parseRollupInput>[] => {
      if (txDetails === 'none') return [];
      if (txDetails === 'hash') {
        return gameInputs.map(tx => tx.paima_tx_hash.toString('hex'));
      }
      return gameInputs.map(tx => parseRollupInput(tx));
    })();
    return {
      success: true,
      result: {
        blockHeight: block.block_height,
        txs,
        blockHash: block.paima_block_hash!.toString('hex'),
        prevBlockHash: block.prev_block == null ? null : block.prev_block.toString('hex'),
        msTimestamp: block.ms_timestamp.getTime(),
      },
    };
  }

  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('/blockHeight')
  public async blockHeight(
    @Query() blockHeight: number,
    @Query() txDetails: 'none' | 'hash' | 'full'
  ): Promise<Result<BlockContentResponse>> {
    if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      return {
        success: false,
        errorMessage: 'Game input storing turned off in the game node',
      };
    }
    const gameStateMachine = EngineService.INSTANCE.getSM();
    const DBConn = gameStateMachine.getReadonlyDbConn();

    const [targetBlock, prevBlock] = await getBlockHeights.run(
      {
        block_heights: [blockHeight, blockHeight - 1],
      },
      DBConn
    );
    if (targetBlock == null || targetBlock.paima_block_hash == null) {
      this.setStatus(StatusCodes.NOT_FOUND);
      return {
        success: false,
        errorMessage: `Block not found at height: ${blockHeight}`,
      };
    }
    const rollupInputs = await getGameInputResultByBlockHeight.run(
      {
        block_height: blockHeight,
      },
      DBConn
    );
    const txs = ((): [] | string[] | ReturnType<typeof parseRollupInput>[] => {
      if (txDetails === 'none') return [];
      if (txDetails === 'hash') return rollupInputs.map(tx => tx.paima_tx_hash.toString('hex'));
      return rollupInputs.map(tx => parseRollupInput(tx));
    })();
    return {
      success: true,
      result: {
        blockHeight,
        txs,
        blockHash: targetBlock.paima_block_hash.toString('hex'),
        prevBlockHash:
          prevBlock.paima_block_hash == null ? null : prevBlock.paima_block_hash.toString('hex'),
        msTimestamp: targetBlock.ms_timestamp.getTime(),
      },
    };
  }
}

type GetLogsResponse = Result<
  {
    topic: string;
    address: string;
    blockHash: string;
    blockNumber: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { [fieldName: string]: any };
    transactionHash: string;
    txIndex: number;
    logIndex: number;
  }[]
>;
type GetLogsParams = {
  fromBlock: number;
  toBlock?: number;
  address?: string | string[];
  filters?: { [fieldName: string]: string };
  topic?: string;
};

@Route('get_logs')
export class GetLogsController extends Controller {
  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<FailedResult>(StatusCodes.BAD_REQUEST)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Post()
  public async post(@Body() params: GetLogsParams): Promise<GetLogsResponse> {
    const gameStateMachine = EngineService.INSTANCE.getSM();

    const toBlock = params.toBlock ?? (await gameStateMachine.latestProcessedBlockHeight());

    if (toBlock < params.fromBlock || toBlock - params.fromBlock > ENV.GET_LOGS_MAX_BLOCK_RANGE) {
      this.setStatus(StatusCodes.BAD_REQUEST);
      return {
        success: false,
        errorMessage: 'Invalid block range',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventDefinition = ((): any => {
      const appEvents = gameStateMachine.getAppEvents();

      for (const defs of Object.values(appEvents)) {
        for (const def of defs) {
          if (def.topicHash === params.topic) {
            return def;
          }
        }
      }

      return undefined;
    })();

    if (!eventDefinition) {
      this.setStatus(StatusCodes.NOT_FOUND);
      return {
        success: false,
        errorMessage: 'Topic not found',
      };
    }

    if (params.filters) {
      const indexedFields = new Set();
      for (const field of eventDefinition.definition.fields) {
        if (field.indexed) {
          indexedFields.add(field.name);
        }
      }

      for (const fieldName of Object.keys(params.filters)) {
        if (!indexedFields.has(fieldName)) {
          this.setStatus(StatusCodes.NOT_FOUND);
          return {
            success: false,
            errorMessage: `Field is not indexed: ${fieldName}`,
          };
        }
      }
    }

    try {
      const DBConn = gameStateMachine.getReadonlyDbConn();

      const conditions: string[] = [];
      // note: these aren't SQL injections since they're guaranteed to be numbers
      conditions.push(`COALESCE(e.block_height >= ${params.fromBlock}, 1=1)`);
      conditions.push(`COALESCE(e.block_height <= ${toBlock}, 1=1)`);

      let queryArgs: any[] = [];
      if (params.address != null) {
        queryArgs.push(typeof params.address === 'string' ? [params.address] : params.address);
        conditions.push(`COALESCE(e.address = ANY($${queryArgs.length}::text[]), 1=1)`);
      }
      if (params.topic != null) {
        queryArgs.push(params.topic);
        conditions.push(`e.topic = $${queryArgs.length}`);
      }
      // it does not seem to be possible to build this dynamic filter with
      // pgtyped, so we instead build a dynamic parametrized query.
      if (params.filters) {
        const keys = Object.keys(params.filters);

        for (let i = 0; i < keys.length; i++) {
          conditions.push(
            `COALESCE(e.data->>$${queryArgs.length + 1} = $${queryArgs.length + 2}, 1=1)`
          );
          queryArgs.push(keys[i]);
          queryArgs.push(params.filters[keys[i]]);
        }
      }
      const query = `
        SELECT
          e.*,
          paima_blocks.main_chain_block_hash,
          res.paima_tx_hash
        FROM event e
        JOIN paima_blocks ON paima_blocks.block_height = e.block_height
        JOIN (
          SELECT rollup_input_result.*
          FROM rollup_input_result
          JOIN rollup_inputs ON rollup_inputs.id = rollup_input_result.id
        ) res ON res.block_height = e.block_height AND res.index_in_block = e.tx_index
        ${conditions.length > 0 ? `WHERE ${conditions.join(' AND\n')}` : ''}
        ORDER BY id;
      `;

      // casting to IGetEventsResult is sound, since both are a select from the
      // same table with the same rows, and at least if the table changes there
      // is a chance that this will not typecheck anymore.
      const rows = (await DBConn.query(query, queryArgs)).rows as (IGetEventsResult &
        Pick<IGetLatestProcessedBlockHeightResult, 'main_chain_block_hash'> &
        Pick<IInsertGameInputResultParams, 'paima_tx_hash'>)[];

      return {
        success: true,
        result: rows.map(row => ({
          topic: row.topic,
          blockHash: row.main_chain_block_hash.toString('hex'),
          blockNumber: row.block_height,
          address: row.address,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: row.data as { [fieldName: string]: any },
          txIndex: row.tx_index,
          transactionHash: row.paima_tx_hash.toString('hex'),
          logIndex: row.log_index,
        })),
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

function parseRollupInput(finalTx: IGetGameInputResultByTxHashResult): TransactionContentResponse {
  return {
    blockHash: finalTx.paima_block_hash!.toString('hex'),
    blockNumber: finalTx.block_height,
    txHash: finalTx.paima_tx_hash.toString('hex'),
    txIndex: finalTx.index_in_block,
    inputData: finalTx.input_data,
    from: finalTx.from_address,
    success: finalTx.success,
    // value: string,
    // nonce: string,
  };
}
