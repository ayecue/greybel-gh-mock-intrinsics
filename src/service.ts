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
  const itrface = new BasicInterface('service');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'install_service',
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
      'start_service',
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
      'stop_service',
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
