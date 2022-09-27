import {
  CustomFunction,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';

export function create(
  mockEnvironment: MockEnvironment,
  source: Type.Device,
  metaFile: Type.File,
  target: Type.Device,
  targetFile: Type.File,
  targetLibrary: Type.Library
): BasicInterface {
  const itrface = new BasicInterface('netSession');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'dump_lib',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
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
  );

  return itrface;
}
