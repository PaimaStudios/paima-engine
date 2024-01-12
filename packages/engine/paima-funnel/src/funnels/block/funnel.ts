import { ENV, Network, doLog, timeout } from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type { ChainData, PresyncChainData } from '@paima/sm';
import { getBaseChainDataMulti, getBaseChainDataSingle } from '../../reading.js';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { BigInt, Transaction } from '@dcspark/cardano-multiplatform-lib-nodejs';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

export class BlockFunnel extends BaseFunnel implements ChainFunnel {
  protected constructor(sharedData: FunnelSharedData, dbTx: PoolClient) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const [fromBlock, toBlock] = await this.adjustBlockHeightRange(
      blockHeight,
      ENV.DEFAULT_FUNNEL_GROUP_SIZE
    );

    if (fromBlock < 0 || toBlock < fromBlock) {
      return [];
    }

    if (toBlock === fromBlock) {
      doLog(`Block funnel ${ENV.CHAIN_ID}: #${toBlock}`);
      return await this.internalReadDataSingle(fromBlock);
    } else {
      doLog(`Block funnel ${ENV.CHAIN_ID}: #${fromBlock}-${toBlock}`);
      return await this.internalReadDataMulti(fromBlock, toBlock);
    }
  }

  /**
   * Will return [-1, -2] if the range is determined to be empty.
   * It should be enough to check that fromBlock >= 0,
   * but this will also fail a fromBlock <= toBlock check.
   */
  private adjustBlockHeightRange = async (
    firstBlockHeight: number,
    blockCount: number
  ): Promise<[number, number]> => {
    const ERR_RESULT: [number, number] = [-1, -2];

    const latestBlockQueryState = this.sharedData.cacheManager.cacheEntries[
      RpcCacheEntry.SYMBOL
    ]?.getState(ENV.CHAIN_ID);
    if (latestBlockQueryState?.state !== RpcRequestState.HasResult) {
      throw new Error(`[funnel] latest block cache entry not found`);
    }

    const fromBlock = Math.max(0, firstBlockHeight);
    const toBlock = Math.min(latestBlockQueryState.result, firstBlockHeight + blockCount - 1);

    if (fromBlock <= toBlock) {
      return [fromBlock, toBlock];
    } else {
      return ERR_RESULT;
    }
  };

  private internalReadDataSingle = async (blockNumber: number): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const [baseChainData, cdeData] = await Promise.all([
        getBaseChainDataSingle(
          this.sharedData.web3,
          this.sharedData.paimaL2Contract,
          blockNumber,
          this.dbTx
        ),
        getUngroupedCdeData(
          this.sharedData.web3,
          this.sharedData.extensions,
          blockNumber,
          blockNumber
        ),
      ]);

      return [
        {
          ...baseChainData,
          extensionDatums: cdeData.flat(),
        },
      ];
    } catch (err) {
      doLog(`[funnel] at ${blockNumber} caught ${err}`);
      throw err;
    }
  };

  private internalReadDataMulti = async (
    fromBlock: number,
    toBlock: number
  ): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }
    try {
      const [baseChainData, ungroupedCdeData] = await Promise.all([
        getBaseChainDataMulti(
          this.sharedData.web3,
          this.sharedData.paimaL2Contract,
          fromBlock,
          toBlock,
          this.dbTx
        ),
        getUngroupedCdeData(this.sharedData.web3, this.sharedData.extensions, fromBlock, toBlock),
      ]);
      const cdeData = groupCdeData(Network.CARDANO, fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    let arg = args.find(arg => arg.network == Network.EVM);

    if (!arg) {
      return [];
    }

    let fromBlock = arg.from;
    let toBlock = arg.to;

    if (fromBlock >= ENV.START_BLOCKHEIGHT) {
      return { [Network.EVM]: FUNNEL_PRESYNC_FINISHED };
    }

    try {
      toBlock = Math.min(toBlock, ENV.START_BLOCKHEIGHT);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return [];
      }

      const ungroupedCdeData = await getUngroupedCdeData(
        this.sharedData.web3,
        this.sharedData.extensions,
        fromBlock,
        toBlock
      );
      return { [Network.EVM]: groupCdeData(Network.EVM, fromBlock, toBlock, ungroupedCdeData) };
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      throw err;
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient
  ): Promise<BlockFunnel> {
    // we always write to this cache instead of reading from it
    // as other funnels used may want to read from this cached data

    const tx =
      '84ac008482582070d2229cb8737535ac876226fca8939f510e5819ca28eb6f952d50303917f87c1818825820859839bf9a1e3e6ef29502a0f48b444e579840816c43274d03574162fc01ae8c00825820c0621c786b6dba70ccc8059127d5f38504a4562f9e2125e2f62670109259b9df01825820e92617cf88c81c9ff13160e857740dab3f7906ef6d813c3e43220ff7236694f5140184a300581d70b4ba3beeaf14b14971e4604027ca594e8fd155f0cdbf1ada9cbd389401821a002dc6c0a1581ca07d73e29a97d0c2e4057badbc27896819cec90d11e052b236b20e41a14001028201d818479f0000000000ffa300581d7068b27aef9fd71651b76eabe6994367439822e8374727118a35eadddc01821a002dc6c0a1581c51bed4db1e9ec8ca4668fc3d217c2efb0029f727c2b80e1e1833796ba14001028201d81858739f1b00000151fe122045021b000043305ce669931b0000000603ce842e1a07512d241b003bf7720a76461e9fc24a032b7cd486b794d2d4d3c24c1580931d1970000000000000ff1b0000018ceecf05901b0000018ceedf84389f1b0000015807bb2ef61b000043305ce66993ff1a002dc6c0ffa300581d703a85e74973d226016bb10f39a0113708856af24408c69ee983f4f73001821a002dc6c0a2581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea144744d494e1b00000151fe122047581ca609c1e386119f68c1d8c5a6555d3417fb10995cee7c8ae1f059d689a14001028201d8184a9f9f0000000000ff02ff82581d609023df4c4713f77ecf9059fe3bba69483cf05de4774218bbb18c8f2d1a0016a05d021a00055e5d031a02464153081a024640270b58204406bffec23011ce81ceab9f7b63f54a8aeff4ef306b08ed7a887666d6805cf70d818258202bca342967927bcb745c69481bd5ad8f30bad124c5d393975e7338d2b098495f040e81581c9023df4c4713f77ecf9059fe3bba69483cf05de4774218bbb18c8f2d0f001082581d609023df4c4713f77ecf9059fe3bba69483cf05de4774218bbb18c8f2d1a0ad79d9b111a002dc6c01283825820025b9cbf45c8464a089bc2684273ad5c6cc2ef27722c8bc2ce42a9543ef3d9d9008258204280930e71e84199480b3511c94dd98251936edb35bdad0e91213e8a6ae5724804825820ccbe05ae6e573702c4596e57541bab35301c4d92c4d79ca4c1c3cdffc72d5eb200a3008182582069b608b7ca2772942d57c7ed4258e4a6bfbae49c633d58e33848e7b50af705aa58402cea244415e440dd75f3f7db3fc946eb70a0b62302c4000817c7318f1efebde1da1c27b5f1c4e7cd3dbceae15804c186d51b722e1b84caece20cdb0bc2a56701048005828400011a002dc6c0821a0017c76d1a28e19b56840002d87980821984221a00cd339ff5f6';
    console.log('tx decoded', computeOutputs(Buffer.from(tx, 'hex')));

    const latestBlock: number = await timeout(
      sharedData.web3.eth.getBlockNumber(),
      GET_BLOCK_NUMBER_TIMEOUT
    );
    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    cacheEntry.updateState(ENV.CHAIN_ID, latestBlock);

    return new BlockFunnel(sharedData, dbTx);
  }
}

function computeOutputs(
  tx: Buffer
): { asset: { policyId: string; assetName: string } | null; amount: string; address: string }[] {
  const transaction = Transaction.from_bytes(tx);

  const rawOutputs = transaction.body().outputs();

  const outputs = [];

  for (let i = 0; i < rawOutputs.len(); i++) {
    const output = rawOutputs.get(i);

    const rawAddress = output.address();
    const address = rawAddress.to_bech32();
    rawAddress.free();

    const amount = output.amount();
    const ma = amount.multiasset();

    if (ma) {
      const policyIds = ma.keys();

      for (let j = 0; j < policyIds.len(); j++) {
        const policyId = policyIds.get(j);

        const assets = ma.get(policyId);

        if (!assets) {
          policyId.free();
          continue;
        }

        const assetNames = assets.keys();

        for (let k = 0; k < assetNames.len(); k++) {
          const assetName = assetNames.get(k);

          const amount = assets.get(assetName);

          if (amount !== undefined) {
            outputs.push({
              amount: amount.to_str(),
              asset: {
                policyId: policyId.to_hex(),
                assetName: Buffer.from(assetName.to_bytes()).toString('hex'),
              },
              address,
            });
          }

          assetName.free();
        }

        assetNames.free();
        assets.free();
        policyId.free();
      }

      policyIds.free();
      ma.free();
    }

    outputs.push({ amount: amount.coin().toString(), asset: null, address });

    amount.free();
    output.free();
  }

  rawOutputs.free();
  transaction.free();

  return outputs;
}
