import {
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createSubWallet } from './sub-wallet';

interface CoinVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
}

class Coin extends BasicInterface {
  static readonly type: string = 'coin';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'set_cycle_mining',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_cycle_mining',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_reward',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'set_reward',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'transaction',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'create_subwallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_subwallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Coin.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment, user, computer } = self.variables;
        return Promise.resolve(
          createSubWallet(mockEnvironment, user, computer)
        );
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_subwallets',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Coin.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment, user, computer } = self.variables;
        return Promise.resolve(
          new CustomList([createSubWallet(mockEnvironment, user, computer)])
        );
      }
    ),
    CustomFunction.createExternalWithSelf(
      'set_address',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_address',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_mined_coins',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  ];

  static retreive(args: Map<string, CustomValue>): Coin | null {
    const intf = args.get('self');
    if (intf instanceof Coin) {
      return intf;
    }
    return null;
  }

  variables: CoinVariables;

  constructor(variables: CoinVariables) {
    super(Coin.type);
    this.variables = variables;
    Coin.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new Coin({
    mockEnvironment,
    user,
    computer
  });

  return itrface;
}
