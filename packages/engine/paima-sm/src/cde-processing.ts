import type { PoolClient } from 'pg';

import { ChainDataExtensionDatumType } from '@paima/utils';
import type { ChainDataExtensionDatum } from './types.js';

import processErc20TransferDatum from './cde-erc20-transfer.js';
import processErc721TransferDatum from './cde-erc721-transfer.js';
import processErc721MintDatum from './cde-erc721-mint.js';
import processErc20DepositDatum from './cde-erc20-deposit.js';
import processErc6551RegistryDatum from './cde-erc6551-registry.js';
import processErc1155TransferDatum from './cde-erc1155-transfer.js';
import processGenericDatum from './cde-generic.js';
import processCardanoDelegationDatum from './cde-cardano-pool.js';
import processCardanoProjectedNFT from './cde-cardano-projected-nft.js';
import processCardanoAssetUtxoDatum from './cde-cardano-delayed-asset.js';
import processCardanoTransferDatum from './cde-cardano-transfer.js';
import processCardanoMintBurnDatum from './cde-cardano-mint-burn.js';
import processDynamicEvmPrimitive from './cde-evm-dynamic-primitive.js';
import processMidnightContractStateDatum from './cde-midnight-contract-state.js';
import assertNever from 'assert-never';
import type { SQLUpdate } from '@paima/db';

export async function cdeTransitionFunction(
  readonlyDBConn: PoolClient,
  cdeDatum: ChainDataExtensionDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  switch (cdeDatum.cdeDatumType) {
    case ChainDataExtensionDatumType.ERC20Transfer:
      return await processErc20TransferDatum(readonlyDBConn, cdeDatum);
    case ChainDataExtensionDatumType.ERC721Transfer:
      return await processErc721TransferDatum(readonlyDBConn, cdeDatum, inPresync);
    case ChainDataExtensionDatumType.ERC721Mint:
      return await processErc721MintDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.ERC20Deposit:
      return await processErc20DepositDatum(readonlyDBConn, cdeDatum, inPresync);
    case ChainDataExtensionDatumType.Erc1155Transfer:
      return await processErc1155TransferDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.Generic:
      return await processGenericDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.ERC6551Registry:
      return await processErc6551RegistryDatum(cdeDatum);
    case ChainDataExtensionDatumType.CardanoPool:
      return await processCardanoDelegationDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.CardanoProjectedNFT:
      return await processCardanoProjectedNFT(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.CardanoAssetUtxo:
      return await processCardanoAssetUtxoDatum(cdeDatum);
    case ChainDataExtensionDatumType.CardanoTransfer:
      return await processCardanoTransferDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.CardanoMintBurn:
      return await processCardanoMintBurnDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.MinaEventGeneric:
      return await processGenericDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.MinaActionGeneric:
      return await processGenericDatum(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.DynamicEvmPrimitive:
      return await processDynamicEvmPrimitive(cdeDatum, inPresync);
    case ChainDataExtensionDatumType.MidnightContractState:
      return await processMidnightContractStateDatum(cdeDatum, inPresync);
    default:
      assertNever(cdeDatum);
  }
}
