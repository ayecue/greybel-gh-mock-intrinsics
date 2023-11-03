import {
  CustomValue
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { placeholderIntrinsic } from './utils';

export interface AptClientVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  computer: Type.Device;
  library: Type.File;
}

export class AptClient extends BasicInterface {
  static readonly type: string = 'aptclientLib';
  static readonly isa: GreyMap = new GreyMap([
    placeholderIntrinsic.forkAs('show'),
    placeholderIntrinsic.forkAs('search'),
    placeholderIntrinsic.forkAs('update'),
    placeholderIntrinsic.forkAs('add_repo'),
    placeholderIntrinsic.forkAs('del_repo'),
    placeholderIntrinsic.forkAs('install'),
    placeholderIntrinsic.forkAs('check_upgrade'),
  ]);

  static retreive(args: Map<string, CustomValue>): AptClient | null {
    const intf = args.get('self');
    if (intf instanceof AptClient) {
      return intf;
    }
    return null;
  }

  variables: AptClientVariables;

  constructor(variables: AptClientVariables) {
    super(AptClient.type, AptClient.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new AptClient({
    mockEnvironment,
    user,
    computer,
    library
  });

  return itrface;
}
