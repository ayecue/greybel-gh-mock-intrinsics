import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createPort } from './port';

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  router: Type.Router
): BasicInterface {
  const itrface = new BasicInterface('router');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'public_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(router.publicIp));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'local_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(router.localIp));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'bssid_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(router.bssid));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'essid_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(router.essid));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'firewall_rules',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.Void);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'kernel_version',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const kernel = router.getFile(['lib', 'kernel_router.so']);

        if (
          kernel === null ||
          !(kernel instanceof Type.File) ||
          !(kernel.type !== Type.FileType.KernelRouter)
        ) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(new CustomString(kernel.version.toString()));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'devices_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const lanIps: CustomString[] = [];

        for (const lanIp of router.devices.keys()) {
          lanIps.push(new CustomString(lanIp));
        }

        return Promise.resolve(new CustomList(lanIps));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'used_ports',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ports: BasicInterface[] = [];

        for (const port of router.ports.values()) {
          if (router.isForwarded(port.port) && !port.isClosed) {
            ports.push(createPort(mockEnvironment, router, port));
          }
        }

        return Promise.resolve(new CustomList(ports));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'device_ports',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ip = args.get('ipAddress');

        if (ip instanceof CustomNil) {
          throw new Error('device_ports: Invalid arguments');
        }

        const device = router.findByLanIp(ip.toString());
        const ports: BasicInterface[] = [];

        for (const port of device.ports.values()) {
          if (device.isForwarded(port.port) && !port.isClosed) {
            ports.push(createPort(mockEnvironment, device, port));
          }
        }

        return Promise.resolve(new CustomList(ports));
      }
    ).addArgument('ipAddress')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'ping_port',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const port = args.get('port');

        if (port instanceof Type.Port) {
          return Promise.resolve(Defaults.Void);
        }

        const portInstance = router.findPort(port.toInt());

        if (portInstance === null) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(
          createPort(mockEnvironment, router, portInstance)
        );
      }
    ).addArgument('port')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'port_info',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const port = args.get('port');

        if (
          !(port instanceof BasicInterface) ||
          port.getCustomType() !== 'port'
        ) {
          return Promise.resolve(new CustomString('port is null'));
        }

        const currentPort = router.findPort(port.getVariable('port'));
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
        }

        return Promise.resolve(
          new CustomString(`${serviceId} ${libraryVersion}`)
        );
      }
    ).addArgument('port')
  );

  return itrface;
}
