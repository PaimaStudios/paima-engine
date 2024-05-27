import { ENV } from '@paima/utils';
import type { CdeCardanoProjectedNFTDatum } from './types.js';
import {
  createScheduledData,
  cdeCardanoProjectedNftInsertData,
  cdeCardanoProjectedNftUpdateData,
} from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processDatum(
  cdeDatum: CdeCardanoProjectedNFTDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const prefix = cdeDatum.scheduledPrefix;
  const ownerAddress = cdeDatum.payload.ownerAddress;
  const previousTxHash = cdeDatum.payload.previousTxHash;
  const previousOutputIndex = cdeDatum.payload.previousTxOutputIndex;
  const currentTxHash = cdeDatum.payload.actionTxId;
  const currentOutputIndex = cdeDatum.payload.actionOutputIndex;
  const amount = cdeDatum.payload.amount;
  const policyId = cdeDatum.payload.policyId;
  const assetName = cdeDatum.payload.assetName;
  const status = cdeDatum.payload.status;
  const datum = cdeDatum.payload.plutusDatum;
  const forHowLong = cdeDatum.payload.forHowLong;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = `${prefix}|${ownerAddress}|${previousTxHash}|${previousOutputIndex}|${currentTxHash}|${currentOutputIndex}|${policyId}|${assetName}|${status}`;

  if (previousTxHash === undefined || previousOutputIndex === undefined) {
    const updateList: SQLUpdate[] = [
      createScheduledData(
        scheduledInputData,
        scheduledBlockHeight,
        cdeDatum.cdeName,
        cdeDatum.transactionHash
      ),
      [
        cdeCardanoProjectedNftInsertData,
        {
          cde_name: cdeName,
          owner_address: ownerAddress,
          current_tx_hash: currentTxHash,
          current_tx_output_index: currentOutputIndex,
          policy_id: policyId,
          asset_name: assetName,
          amount: amount,
          status: status,
          plutus_datum: datum,
          for_how_long: forHowLong,
        },
      ],
    ];
    return updateList;
  }
  const updateList: SQLUpdate[] = [
    createScheduledData(
      scheduledInputData,
      scheduledBlockHeight,
      cdeDatum.cdeName,
      cdeDatum.transactionHash
    ),
    [
      cdeCardanoProjectedNftUpdateData,
      {
        cde_name: cdeName,
        owner_address: ownerAddress,
        new_tx_hash: currentTxHash,
        new_tx_output_index: currentOutputIndex,
        previous_tx_hash: previousTxHash,
        previous_tx_output_index: previousOutputIndex,
        policy_id: policyId,
        asset_name: assetName,
        amount: amount,
        status: status,
        plutus_datum: datum,
        for_how_long: forHowLong,
      },
    ],
  ];

  return updateList;
}
