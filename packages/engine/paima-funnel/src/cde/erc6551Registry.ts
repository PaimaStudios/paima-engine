import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeErc6551RegistryDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc6551Registry,
} from '@paima/runtime';
import type { AccountCreated } from '@paima/utils/src/contract-types/ERC6551RegistryContract';

export default async function getCdeData(
  extension: ChainDataExtensionErc6551Registry,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  const { implementation, tokenContract, tokenId } = extension;
  const filter = {
    ...(implementation !== null && implementation !== undefined ? { implementation } : {}),
    ...(tokenContract !== null && tokenContract !== undefined ? { tokenContract } : {}),
    ...(tokenId !== null && tokenId !== undefined ? { tokenId } : {}),
  };
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('AccountCreated', {
      filter,
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as AccountCreated[];

  // salt is not an indexed field, so we have to run the filter after the fact
  const filteredEvents =
    extension.salt == null ? events : events.filter(e => e.returnValues.salt === extension.salt);
  return filteredEvents.map((e: AccountCreated) => toDatum(e, extension)).flat();
}

function toDatum(
  event: AccountCreated,
  extension: ChainDataExtensionErc6551Registry
): CdeErc6551RegistryDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC6551Registry,
    blockNumber: event.blockNumber,
    payload: {
      accountCreated: event.returnValues.account,
      implementation: event.returnValues.implementation,
      chainId: event.returnValues.chainId,
      tokenContract: event.returnValues.tokenContract,
      tokenId: event.returnValues.tokenId,
      salt: event.returnValues.salt,
    },
  };
}
