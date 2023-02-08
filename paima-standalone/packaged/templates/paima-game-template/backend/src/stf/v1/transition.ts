import parse, { isInvalid } from './parser.js';
import Prando from 'paima-sdk/paima-prando';
import { SQLUpdate, SubmittedChainData } from 'paima-sdk/paima-utils';
import { persistUserUpdate } from './persist.js';
import { getUser, IGetUserResult, Pool } from '@game/db';

export default async function (
  inputData: SubmittedChainData,
  _blockHeight: number,
  _randomnessGenerator: Prando,
  dbConn: Pool
): Promise<SQLUpdate[]> {
  console.log(inputData, 'parsing input data');
  const user = inputData.userAddress.toLowerCase();
  console.log(`Processing input string: ${inputData.inputData}`);
  const expanded = parse(inputData.inputData);
  if (isInvalid(expanded)) {
    console.log(`Invalid input string`);
    return [];
  }
  console.log(`Input string parsed as: ${expanded.input}`);

  switch (expanded.input) {
    case 'gainedExperience':
      const [userState] = await getUser.run({ wallet: user }, dbConn);
      const blankUserState: IGetUserResult = { experience: 0, wallet: user };
      const userUpdateQuery = persistUserUpdate(
        user,
        expanded.experience,
        userState ?? blankUserState
      );
      return [userUpdateQuery];
    default:
      return [];
  }
}
