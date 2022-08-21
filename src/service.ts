import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import { Computer, User } from './types';

export function create(_user: User, _computer: Computer): BasicInterface {
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
