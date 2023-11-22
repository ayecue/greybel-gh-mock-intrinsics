import {
  CustomValue
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { placeholderIntrinsic } from './utils';

export interface SubWalletVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
}

export class SubWallet extends BasicInterface {
  static readonly type: string = 'subwallet';
  static readonly isa: GreyMap = new GreyMap([
    placeholderIntrinsic.forkAs('get_balance'),
    placeholderIntrinsic.forkAs('set_info'),
    placeholderIntrinsic.forkAs('get_info'),
    placeholderIntrinsic.forkAs('delete'),
    placeholderIntrinsic.forkAs('get_user'),
    placeholderIntrinsic.forkAs('last_transaction'),
    placeholderIntrinsic.forkAs('mining'),
    placeholderIntrinsic.forkAs('check_password'),
    placeholderIntrinsic.forkAs('wallet_username')
  ]);

  static retreive(args: Map<string, CustomValue>): SubWallet | null {
    const intf = args.get('self');
    if (intf instanceof SubWallet) {
      return intf;
    }
    return null;
  }

  variables: SubWalletVariables;

  constructor(variables: SubWalletVariables) {
    super(SubWallet.type, SubWallet.isa);
    this.variables = variables;
  }
}
export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new SubWallet({
    mockEnvironment,
    user,
    computer
  });

  return itrface;
}
