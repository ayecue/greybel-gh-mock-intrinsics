import {
  CustomFunction,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';

export const installService = CustomFunction.createExternalWithSelf(
  'install_service',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Service.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { user, computer, library } = self.variables;

    if (user.username !== 'root') {
      return Promise.resolve(
        new CustomString('Denied. Only root user can install this service.')
      );
    }

    computer.installServiceByFiletype(library.type);

    return Promise.resolve(DefaultType.True);
  }
);

export const startService = CustomFunction.createExternalWithSelf(
  'start_service',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Service.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { user, computer, library } = self.variables;
    const exisitingService = computer.findServiceByFiletype(library.type);

    if (exisitingService) {
      return Promise.resolve(DefaultType.Void);
    }

    if (user.username !== 'root') {
      return Promise.resolve(
        new CustomString('Denied. Only root user can install this service.')
      );
    }

    computer.addServiceByFiletype(library.type);

    return Promise.resolve(DefaultType.True);
  }
);

export const stopService = CustomFunction.createExternalWithSelf(
  'stop_service',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Service.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { user, computer, library } = self.variables;
    const exisitingService = computer.findServiceByFiletype(library.type);

    if (!exisitingService) {
      return Promise.resolve(DefaultType.Void);
    }

    if (user.username !== 'root') {
      return Promise.resolve(
        new CustomString('Denied. Only root user can install this service.')
      );
    }

    exisitingService.delete();

    return Promise.resolve(DefaultType.True);
  }
);

export interface ServiceVariables {
  mockEnvironment: MockEnvironment;
  library: Type.File;
  user: Type.User;
  computer: Type.Device;
}

export class Service extends BasicInterface {
  static readonly type: string = 'service';
  static readonly isa: GreyMap = new GreyMap([
    installService,
    startService,
    stopService
  ]);

  static retreive(args: Map<string, CustomValue>): Service | null {
    const intf = args.get('self');
    if (intf instanceof Service) {
      return intf;
    }
    return null;
  }

  variables: ServiceVariables;

  constructor(variables: ServiceVariables) {
    super(Service.type, Service.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new Service({
    mockEnvironment,
    library,
    user,
    computer
  });

  return itrface;
}
