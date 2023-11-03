import {
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { create as createSubWallet } from './sub-wallet';
import { placeholderIntrinsic } from './utils';

export const getSubwallet = CustomFunction.createExternalWithSelf(
  'get_subwallet',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Coin.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, computer } = self.variables;
    return Promise.resolve(
      createSubWallet(mockEnvironment, user, computer)
    );
  }
);

export const getSubwallets = CustomFunction.createExternalWithSelf(
  'get_subwallets',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Coin.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, computer } = self.variables;
    return Promise.resolve(
      new CustomList([createSubWallet(mockEnvironment, user, computer)])
    );
  }
);

export interface CoinVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
}

export class Coin extends BasicInterface {
  static readonly type: string = 'coin';
  static readonly isa: GreyMap = new GreyMap([
    placeholderIntrinsic.forkAs('set_cycle_mining'),
    placeholderIntrinsic.forkAs('get_cycle_mining'),
    placeholderIntrinsic.forkAs('get_reward'),
    placeholderIntrinsic.forkAs('set_reward'),
    placeholderIntrinsic.forkAs('transaction'),
    placeholderIntrinsic.forkAs('create_subwallet'),
    getSubwallet,
    getSubwallets,
    placeholderIntrinsic.forkAs('set_address'),
    placeholderIntrinsic.forkAs('get_address'),
    placeholderIntrinsic.forkAs('get_mined_coins')
  ]);

  static retreive(args: Map<string, CustomValue>): Coin | null {
    const intf = args.get('self');
    if (intf instanceof Coin) {
      return intf;
    }
    return null;
  }

  variables: CoinVariables;

  constructor(variables: CoinVariables) {
    super(Coin.type, Coin.isa);
    this.variables = variables;
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
