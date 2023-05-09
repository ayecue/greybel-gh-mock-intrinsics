import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createPort, Port } from './port';

export interface RouterVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  router: Type.Router;
}

export class Router extends BasicInterface {
  static readonly type: string = 'router';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'public_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        return Promise.resolve(new CustomString(router.publicIp));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'local_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        return Promise.resolve(new CustomString(router.localIp));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'bssid_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        return Promise.resolve(new CustomString(router.mac));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'essid_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        return Promise.resolve(new CustomString(router.wifi.name));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'firewall_rules',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        return Promise.resolve(new CustomList());
      }
    ),

    CustomFunction.createExternalWithSelf(
      'kernel_version',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        const kernel = router.getFile(['lib', 'kernel_router.so']);

        if (
          kernel === null ||
          !(kernel instanceof Type.File) ||
          kernel.type !== Type.FileType.KernelRouter
        ) {
          return Promise.resolve(DefaultType.Void);
        }

        return Promise.resolve(new CustomString(kernel.version.toString()));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'devices_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        const lanIps: CustomString[] = [];

        for (const lanIp of router.devices.keys()) {
          lanIps.push(new CustomString(lanIp));
        }

        return Promise.resolve(new CustomList(lanIps));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'used_ports',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router, mockEnvironment } = self.variables;
        const ports: BasicInterface[] = [];

        for (const port of router.ports.values()) {
          if (router.isForwarded(port.port) && !port.isClosed) {
            ports.push(createPort(mockEnvironment, router, port));
          }
        }

        for (const forwardedPort of router.forwarded.values()) {
          const device = router.getForwarded(forwardedPort.port);
          const port = device.findPort(forwardedPort.port);

          if (device && port) {
            ports.push(createPort(mockEnvironment, device, port));
          }
        }

        return Promise.resolve(new CustomList(ports));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'device_ports',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router, mockEnvironment } = self.variables;
        const ip = args.get('ipAddress');

        if (ip instanceof CustomNil) {
          throw new Error('device_ports: Invalid arguments');
        }

        const device = router.findByLanIp(ip.toString());

        if (device === null) {
          return Promise.resolve(new CustomList());
        }

        const ports: BasicInterface[] = [];

        for (const port of device.ports.values()) {
          ports.push(createPort(mockEnvironment, device, port));
        }

        return Promise.resolve(new CustomList(ports));
      }
    ).addArgument('ipAddress'),

    CustomFunction.createExternalWithSelf(
      'ping_port',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router, mockEnvironment } = self.variables;
        const port = args.get('port');

        if (port instanceof Type.Port) {
          return Promise.resolve(DefaultType.Void);
        }

        const portInstance = router.findPort(port.toInt());

        if (portInstance !== null) {
          return Promise.resolve(
            createPort(mockEnvironment, router, portInstance)
          );
        } else if (router.isForwarded(port.toInt())) {
          const device = router.getForwarded(port.toInt());
          const devicePort = device.findPort(port.toInt());

          if (device && devicePort) {
            return Promise.resolve(
              createPort(mockEnvironment, device, devicePort)
            );
          }
        }

        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('port'),

    CustomFunction.createExternalWithSelf(
      'port_info',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = Router.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { router } = self.variables;
        const port = args.get('port');

        if (
          !(port instanceof BasicInterface) ||
          port.getCustomType() !== Port.type
        ) {
          return Promise.resolve(new CustomString('port is null'));
        }

        const portNumber = port.getVariable<Type.Port>('port').port;
        const currentPort = router.findPort(portNumber);
        let serviceId = 'unknown';
        let libraryVersion = 'unknown';

        if (currentPort !== null) {
          serviceId = currentPort.service;

          const device = router.findDeviceByPort(currentPort);

          if (device) {
            const file = device.findLibraryFileByPort(currentPort);

            if (file) {
              libraryVersion = file.version.toString();
            }
          }
        } else if (router.isForwarded(portNumber)) {
          const device = router.getForwarded(portNumber);
          const devicePort = device.findPort(portNumber);

          if (device && devicePort) {
            serviceId = devicePort.service;
            const file = device.findLibraryFileByPort(devicePort);

            if (file) {
              libraryVersion = file.version.toString();
            }
          }
        }

        return Promise.resolve(
          new CustomString(`${serviceId} ${libraryVersion}`)
        );
      }
    ).addArgument('port')
  ];

  static retreive(args: Map<string, CustomValue>): Router | null {
    const intf = args.get('self');
    if (intf instanceof Router) {
      return intf;
    }
    return null;
  }

  variables: RouterVariables;

  constructor(variables: RouterVariables) {
    super(Router.type);
    this.variables = variables;
    Router.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  router: Type.Router
): BasicInterface {
  const itrface = new Router({
    mockEnvironment,
    user,
    router
  });

  return itrface;
}
