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
  computer: Type.Computer,
  targetComputer: Type.Computer,
  library: Type.Library
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
        return Promise.resolve(
          createMetaLib(mockEnvironment, computer, targetComputer, library)
        );
      }
    )
  );

  return itrface;
}
