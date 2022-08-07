import {
  CustomFunction,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';
import { Computer, Library } from './types';

export function create(
  computer: Computer,
  targetComputer: Computer,
  library: Library
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
          createMetaLib(computer, targetComputer, library)
        );
      }
    )
  );

  return itrface;
}
