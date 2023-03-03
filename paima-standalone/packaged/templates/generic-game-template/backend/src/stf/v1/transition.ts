import parse, { isInvalid } from './parser.js';
import type Prando from 'paima-sdk/paima-prando';
import type { SQLUpdate, SubmittedData } from 'paima-sdk/paima-utils';
import { persistUserUpdate } from './persist.js';
import type { IGetUserResult, Pool } from '@game/db';
import { getUser } from '@game/db';

export default async function (
  inputData: SubmittedData,
  _blockHeight: number,
  _randomnessGenerator: Prando,
  dbConn: Pool
): Promise<SQLUpdate[]> {
  console.log(inputData, 'parsing input data');
  console.log(`Processing input string: ${inputData.inputData}`);
  const expanded = parse(inputData.inputData);
  if (isInvalid(expanded)) {
    console.log(`Invalid input string`);
    return [];
  }
  console.log(`Input string parsed as: ${expanded.input}`);

  switch (expanded.input) {
    case 'gainedExperience':
      const [userState] = await getUser.run({ wallet: expanded.address }, dbConn);
      const blankUserState: IGetUserResult = { experience: 0, wallet: expanded.address };
      const userUpdateQuery = persistUserUpdate(
        expanded.address,
        expanded.experience,
        userState ?? blankUserState
      );
      return [userUpdateQuery];
    default:
      return [];
  }
}
