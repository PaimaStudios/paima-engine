import {
  ENV,
  type InternalServerErrorResult,
  type Result,
  type ValidateErrorResult,
} from '@paima/utils';
import { StatusCodes } from 'http-status-codes';
import { Controller, Response, Query, Get, Route } from 'tsoa';
import { EngineService } from '../EngineService.js';
import { cdeBatcherPaymentByAddress } from '@paima/db';

@Route('batcher_payment')
export class BatcherPaymentController extends Controller {
  @Response<InternalServerErrorResult>(StatusCodes.BAD_REQUEST)
  @Response<InternalServerErrorResult>(StatusCodes.NOT_FOUND)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get()
  public async get(
    @Query() batcher_address: string,
    @Query() user_address: string
  ): Promise<Result<{ balance: string }>> {
    if (!ENV.BATCHER_PAYMENT_ENABLED) {
      this.setStatus(StatusCodes.BAD_REQUEST);
      return {
        success: false,
        errorMessage: 'Env variable "BATCHER_PAYMENT_ENABLED" is not set.',
        errorCode: StatusCodes.BAD_REQUEST,
      };
    }
    const gameStateMachine = EngineService.INSTANCE.getSM();
    const DBConn = gameStateMachine.getReadonlyDbConn();
    const [balance] = await cdeBatcherPaymentByAddress.run(
      {
        batcher_address: batcher_address.toLocaleLowerCase(),
        user_address: user_address.toLocaleLowerCase(),
      },
      DBConn
    );
    if (!balance) {
      this.setStatus(StatusCodes.NOT_FOUND);
      return {
        success: false,
        errorMessage: 'Batcher and user address pair not found.',
        errorCode: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, result: { balance: balance.balance } };
  }
}
