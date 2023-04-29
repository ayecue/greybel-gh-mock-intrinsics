import {
  CustomFunction,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';

export interface NetSessionVariables {
  mockEnvironment: MockEnvironment;
  source: Type.Device;
  metaFile: Type.File;
  target: Type.Device;
  targetFile: Type.File;
  targetLibrary: Type.Library;
}

export class NetSession extends BasicInterface {
  static readonly type: string = 'NetSession';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'dump_lib',
      (
        _ctx: OperationContext,
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
    )
  ];

  static retreive(args: Map<string, CustomValue>): NetSession | null {
    const intf = args.get('self');
    if (intf instanceof NetSession) {
      return intf;
    }
    return null;
  }

  variables: NetSessionVariables;

  constructor(variables: NetSessionVariables) {
    super(NetSession.type);
    this.variables = variables;
    NetSession.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
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
