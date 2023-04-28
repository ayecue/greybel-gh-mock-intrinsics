import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';

export interface AptClientVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
  library: Type.File;
}

export class AptClient extends BasicInterface {
  static readonly type: string = 'aptclientLib';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'show',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'search',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'update',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'add_repo',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'del_repo',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
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
      'check_upgrade',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  ];

  static retreive(args: Map<string, CustomValue>): AptClient | null {
    const intf = args.get('self');
    if (intf instanceof AptClient) {
      return intf;
    }
    return null;
  }

  variables: AptClientVariables;

  constructor(variables: AptClientVariables) {
    super(AptClient.type);
    this.variables = variables;
    AptClient.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new AptClient({
    mockEnvironment,
    user,
    computer,
    library
  });

  return itrface;
}
