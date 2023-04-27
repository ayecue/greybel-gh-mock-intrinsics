import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';

interface WalletVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
}

class Wallet extends BasicInterface {
  static readonly type: string = 'wallet';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'list_coins',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_balance',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'buy_coin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'sell_coin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_pending_trade',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'cancel_pending_trade',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_global_offers',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'list_global_coins',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'show_nodes',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'reset_password',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_pin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  ];

  static retreive(args: Map<string, CustomValue>): Wallet | null {
    const intf = args.get('self');
    if (intf instanceof Wallet) {
      return intf;
    }
    return null;
  }

  variables: WalletVariables;

  constructor(variables: WalletVariables) {
    super(Wallet.type);
    this.variables = variables;
    Wallet.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new Wallet({
    mockEnvironment,
    user,
    computer
  });

  return itrface;
}
