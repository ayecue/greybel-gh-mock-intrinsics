import {
  CustomFunction,
  CustomValue,
  DefaultType,
  VM
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import { create as createCoin } from './coin';
import GreyMap from './grey-map';
import BasicInterface from './interface';
import { create as createWalletObject } from './wallet';
import { placeholderIntrinsic } from './utils';

export const getCoin = CustomFunction.createExternalWithSelf(
  'get_coin',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Blockchain.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, computer } = self.variables;
    return Promise.resolve(createCoin(mockEnvironment, user, computer));
  }
);

export const loginWallet = CustomFunction.createExternalWithSelf(
  'login_wallet',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Blockchain.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, computer } = self.variables;
    return Promise.resolve(createWalletObject(mockEnvironment, user, computer));
  }
);

export const createWallet = CustomFunction.createExternalWithSelf(
  'create_wallet',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Blockchain.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, computer } = self.variables;
    return Promise.resolve(createWalletObject(mockEnvironment, user, computer));
  }
);

export interface BlockchainVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
  library: Type.File;
}

export class Blockchain extends BasicInterface {
  static readonly type: string = 'blockchainLib';
  static readonly isa: GreyMap = new GreyMap([
    placeholderIntrinsic.forkAs('coin_price'),
    placeholderIntrinsic.forkAs('show_history'),
    placeholderIntrinsic.forkAs('amount_mined'),
    getCoin,
    loginWallet,
    placeholderIntrinsic.forkAs('install'),
    createWallet,
    placeholderIntrinsic.forkAs('delete_coin')
  ]);

  static retreive(args: Map<string, CustomValue>): Blockchain | null {
    const intf = args.get('self');
    if (intf instanceof Blockchain) {
      return intf;
    }
    return null;
  }

  variables: BlockchainVariables;

  constructor(variables: BlockchainVariables) {
    super(Blockchain.type, Blockchain.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new Blockchain({
    mockEnvironment,
    library,
    user,
    computer
  });

  return itrface;
}
