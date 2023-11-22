import {
  CustomBoolean,
  CustomFunction,
  CustomNumber,
  CustomValue,
  DefaultType,
  VM
} from 'greybel-interpreter';
import { Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';
import { GHMockIntrinsicEnv } from './mock/environment';

export const dumpLib = CustomFunction.createExternalWithSelf(
  'dump_lib',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      mockEnvironment,
      source,
      metaFile,
      target,
      targetFile,
      targetLibrary
    } = self.variables;
    const mode = Type.VulnerabilityMode.Online;
    const libContainer = mockEnvironment.libraryManager.get(targetLibrary);
    const libVersion = libContainer.get(targetFile.version);
    const vuls = libVersion.getVulnerabilitiesByMode(mode);

    return Promise.resolve(
      createMetaLib(
        mockEnvironment,
        source,
        metaFile,
        target,
        targetFile,
        mode,
        libContainer,
        libVersion,
        vuls
      )
    );
  }
);

export const getNumUsers = CustomFunction.createExternalWithSelf(
  'get_num_users',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      target
    } = self.variables;

    return Promise.resolve(
      new CustomNumber(target.users.size)
    );
  }
);

export const getNumPortforward = CustomFunction.createExternalWithSelf(
  'get_num_portforward',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      target
    } = self.variables;
    const router = target.getRouter() as Type.Router;

    return Promise.resolve(
      new CustomNumber(router.forwarded.size)
    );
  }
);

export const getNumConnGateway = CustomFunction.createExternalWithSelf(
  'get_num_conn_gateway',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      target
    } = self.variables;
    const router = target.getRouter() as Type.Router;

    return Promise.resolve(
      new CustomNumber(router.devices.size)
    );
  }
);

export const isAnyActiveUser = CustomFunction.createExternalWithSelf(
  'is_any_active_user',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      target
    } = self.variables;

    return Promise.resolve(
      new CustomBoolean(target.isAnyProcessActive())
    );
  }
);

export const isRootActiveUser = CustomFunction.createExternalWithSelf(
  'is_root_active_user',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = NetSession.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const {
      target
    } = self.variables;

    return Promise.resolve(
      new CustomBoolean(target.isRootProcessActive())
    );
  }
);

export interface NetSessionVariables {
  mockEnvironment: GHMockIntrinsicEnv;
  source: Type.Device;
  metaFile: Type.File;
  target: Type.Device;
  targetFile: Type.File;
  targetLibrary: Type.Library;
}

export class NetSession extends BasicInterface {
  static readonly type: string = 'NetSession';
  static readonly isa: GreyMap = new GreyMap([
    dumpLib,
    getNumUsers,
    getNumPortforward,
    getNumConnGateway,
    isAnyActiveUser,
    isRootActiveUser
  ]);

  static retreive(args: Map<string, CustomValue>): NetSession | null {
    const intf = args.get('self');
    if (intf instanceof NetSession) {
      return intf;
    }
    return null;
  }

  variables: NetSessionVariables;

  constructor(variables: NetSessionVariables) {
    super(NetSession.type, NetSession.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: GHMockIntrinsicEnv,
  source: Type.Device,
  metaFile: Type.File,
  target: Type.Device,
  targetFile: Type.File,
  targetLibrary: Type.Library
): BasicInterface {
  const itrface = new NetSession({
    mockEnvironment,
    source,
    metaFile,
    target,
    targetFile,
    targetLibrary
  });

  return itrface;
}
