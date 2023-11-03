import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { placeholderIntrinsic } from './utils';

export interface WalletVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
}

export class Wallet extends BasicInterface {
  static readonly type: string = 'wallet';
  static readonly isa: GreyMap = new GreyMap([
    placeholderIntrinsic.forkAs('list_coins'),
    placeholderIntrinsic.forkAs('get_balance'),
    placeholderIntrinsic.forkAs('buy_coin'),
    placeholderIntrinsic.forkAs('sell_coin'),
    placeholderIntrinsic.forkAs('get_pending_trade'),
    placeholderIntrinsic.forkAs('cancel_pending_trade'),
    placeholderIntrinsic.forkAs('get_global_offers'),
    placeholderIntrinsic.forkAs('list_global_coins'),
    placeholderIntrinsic.forkAs('show_nodes'),
    placeholderIntrinsic.forkAs('reset_password'),
    placeholderIntrinsic.forkAs('get_pin'),
  ]);

  static retreive(args: Map<string, CustomValue>): Wallet | null {
    const intf = args.get('self');
    if (intf instanceof Wallet) {
      return intf;
    }
    return null;
  }

  variables: WalletVariables;

  constructor(variables: WalletVariables) {
    super(Wallet.type, Wallet.isa);
    this.variables = variables;
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
