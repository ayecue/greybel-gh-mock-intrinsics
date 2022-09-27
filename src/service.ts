import {
  CustomFunction,
  CustomString,
  CustomValue,
  OperationContext,
  Defaults
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';

export function create(
  _mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  computer: Type.Device
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
        if (user.username !== 'root') {
          return Promise.resolve(new CustomString('Denied. Only root user can install this service.'));
        }

        computer.installServiceByFiletype(library.type);

        return Promise.resolve(Defaults.True);
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
        const exisitingService = computer.findServiceByFiletype(library.type);

        if (exisitingService) {
          return Promise.resolve(Defaults.Void);
        }

        if (user.username !== 'root') {
          return Promise.resolve(new CustomString('Denied. Only root user can install this service.'));
        }

        computer.addServiceByFiletype(library.type);

        return Promise.resolve(Defaults.True);
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
        const exisitingService = computer.findServiceByFiletype(library.type);

        if (!exisitingService) {
          return Promise.resolve(Defaults.Void);
        }

        if (user.username !== 'root') {
          return Promise.resolve(new CustomString('Denied. Only root user can install this service.'));
        }

        exisitingService.delete();

        return Promise.resolve(Defaults.True);
      }
    )
  );

  return itrface;
}
