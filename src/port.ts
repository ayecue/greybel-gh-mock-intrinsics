import {
  CustomBoolean,
  CustomFunction,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';

interface PortVariables {
  mockEnvironment: MockEnvironment;
  device: Type.Device;
  port: Type.Port;
}

class Port extends BasicInterface {
  static readonly type: string = 'port';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'get_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Port.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
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
          return Promise.resolve(Defaults.Void);
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
          return Promise.resolve(Defaults.Void);
        }

        const { port } = self.variables;
        return Promise.resolve(new CustomNumber(port.port));
      }
    )
  ];

  static retreive(args: Map<string, CustomValue>): Port | null {
    const intf = args.get('self');
    if (intf instanceof Port) {
      return intf;
    }
    return null;
  }

  variables: PortVariables;

  constructor(variables: PortVariables) {
    super(Port.type);
    this.variables = variables;
    Port.customIntrinsics.forEach(this.addMethod.bind(this));
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
