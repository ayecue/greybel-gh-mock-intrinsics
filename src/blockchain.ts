import {
  CustomFunction,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import { create as createCoin } from './coin';
import BasicInterface from './interface';
import { create as createWallet } from './wallet';

export interface BlockchainVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
  library: Type.File;
}

export class Blockchain extends BasicInterface {
  static readonly type: string = 'blockchainLib';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'coin_price',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'show_history',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'amount_mined',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_coin',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Blockchain.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment, user, computer } = self.variables;
        return Promise.resolve(createCoin(mockEnvironment, user, computer));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'login_wallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Blockchain.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment, user, computer } = self.variables;
        return Promise.resolve(createWallet(mockEnvironment, user, computer));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'install',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'create_wallet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Blockchain.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment, user, computer } = self.variables;
        return Promise.resolve(createWallet(mockEnvironment, user, computer));
      }
    ),
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
  ];

  static retreive(args: Map<string, CustomValue>): Blockchain | null {
    const intf = args.get('self');
    if (intf instanceof Blockchain) {
      return intf;
    }
    return null;
  }

  variables: BlockchainVariables;

  constructor(variables: BlockchainVariables) {
    super(Blockchain.type);
    this.variables = variables;
    Blockchain.customIntrinsics.forEach(this.addMethod.bind(this));
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
