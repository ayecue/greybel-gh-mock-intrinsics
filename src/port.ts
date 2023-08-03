import {
  CustomBoolean,
  CustomFunction,
  CustomNumber,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';

export interface PortVariables {
  mockEnvironment: MockEnvironment;
  device: Type.Device;
  port: Type.Port;
}

export class Port extends BasicInterface {
  static readonly type: string = 'port';
  static readonly isa: GreyMap = new GreyMap([
    CustomFunction.createExternalWithSelf(
      'get_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Port.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { device } = self.variables;
        return Promise.resolve(new CustomString(device.localIp));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'is_closed',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Port.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { port } = self.variables;
        return Promise.resolve(new CustomBoolean(port.isClosed));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'port_number',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Port.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { port } = self.variables;
        return Promise.resolve(new CustomNumber(port.port));
      }
    )
  ]);

  static retreive(args: Map<string, CustomValue>): Port | null {
    const intf = args.get('self');
    if (intf instanceof Port) {
      return intf;
    }
    return null;
  }

  variables: PortVariables;

  constructor(variables: PortVariables) {
    super(Port.type, Port.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  device: Type.Device,
  port: Type.Port
): BasicInterface {
  const itrface = new Port({
    mockEnvironment,
    device,
    port
  });

  return itrface;
}
