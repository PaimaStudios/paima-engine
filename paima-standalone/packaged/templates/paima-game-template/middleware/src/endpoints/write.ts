import type { ActionResult } from '../types';
import { builder } from 'paima-sdk/paima-concise';
import { getEthAddress } from '../state';
import { postConciselyEncodedData } from '../helpers/posting';

async function gainExperience(count: number): Promise<ActionResult> {
  const userWalletAddress = getEthAddress();

  const conciseBuilder = builder.initialize();
  conciseBuilder.setPrefix('xp');
  conciseBuilder.addValue({ value: count.toString() });

  const result = await postConciselyEncodedData(userWalletAddress, conciseBuilder.build());
  return { success: result.success };
}

export const writeEndpoints = {
  gainExperience,
};
