import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { Type } from 'greybel-mock-environment';

import BasicInterface from './interface';

export function create(
  _user: Type.User,
  _computer: Type.Computer
): BasicInterface {
  const itrface = new BasicInterface('aptClient');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'show',
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
      'search',
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
      'update',
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
      'add_repo',
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
      'del_repo',
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
      'check_upgrade',
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
