import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import { create as createCoin } from './coin';
import BasicInterface from './interface';
import { create as createWallet } from './wallet';

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  computer: Type.Computer
): BasicInterface {
  const itrface = new BasicInterface('blockchain');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'coin_price',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'show_history',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'amount_mined',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_coin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(createCoin(mockEnvironment, user, computer));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'login_wallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(createWallet(mockEnvironment, user, computer));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'install',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'create_wallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(createWallet(mockEnvironment, user, computer));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete_coin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  return itrface;
}
