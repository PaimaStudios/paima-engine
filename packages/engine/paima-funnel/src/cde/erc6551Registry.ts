import {
  ChainDataExtensionDatumType,
  DEFAULT_FUNNEL_TIMEOUT,
  ERC6551_REGISTRY_DEFAULT,
  timeout,
} from '@paima/utils';
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

  // old ERC6551 did not have any indexed fields
  const filter =
    extension.contractAddress === ERC6551_REGISTRY_DEFAULT.Old
      ? {}
      : {
          ...(implementation != null ? { implementation } : {}),
          ...(tokenContract != null ? { tokenContract } : {}),
          ...(tokenId != null ? { tokenId } : {}),
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
  const filteredEvents = ((): AccountCreated[] => {
    let withFilter =
      extension.salt == null ? events : events.filter(e => e.returnValues.salt === extension.salt);

    // new ERC6551 uses indexed fields, so we can just return early
    if (extension.contractAddress !== ERC6551_REGISTRY_DEFAULT.Old) {
      return withFilter;
    }
    withFilter =
      implementation == null
        ? withFilter
        : withFilter.filter(e => e.returnValues.implementation === extension.implementation);
    withFilter =
      tokenContract == null
        ? withFilter
        : withFilter.filter(e => e.returnValues.tokenContract === extension.tokenContract);
    withFilter =
      tokenId == null
        ? withFilter
        : withFilter.filter(e => e.returnValues.tokenId === extension.tokenId);
    return withFilter;
  })();
  const result = filteredEvents.map((e: AccountCreated) => toDatum(e, extension)).flat();
  return result;
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
