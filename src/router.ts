import {
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { create as createPort } from './port';
import { Type } from 'greybel-mock-environment';

export function create(user: Type.User, router: Type.Router): BasicInterface {
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
        const result = mockEnvironment.get().networks.find(
          (v: Type.Network) => v.router.publicIp === router.publicIp
        );

        return Promise.resolve(
          result ? new CustomString(result.bssid) : Defaults.Void
        );
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
        const result = mockEnvironment.get().networks.find(
          (v: Type.Network) => v.router.publicIp === router.publicIp
        );

        return Promise.resolve(
          result ? new CustomString(result.essid) : Defaults.Void
        );
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'computers_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const result = mockEnvironment.get()
          .getComputersOfRouter(router)
          .map((item: Type.Computer) => new CustomString(item.localIp));

        return Promise.resolve(new CustomList(result));
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
        const result =
          mockEnvironment.get()
            .getForwardedPortsOfRouter(router)
            .map((item: Type.Port) => createPort(router, item)) || [];

        return Promise.resolve(new CustomList(result));
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
        const ipAddress = args.get('ipAddress').toString();
        const device = mockEnvironment.get().getComputerInLan(ipAddress, router);

        if (!device) {
          return Promise.resolve(new CustomList());
        }

        const result = device.ports.map((item: Type.Port) =>
          createPort(device, item)
        );

        return Promise.resolve(new CustomList(result));
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
        const port = args.get('port').toInt();
        const computers = mockEnvironment.get().getComputersOfRouterByIp(
          router.publicIp
        );

        for (const item of computers) {
          if (item.router.publicIp === router.publicIp) {
            continue;
          }

          for (const itemPort of item.ports) {
            if (itemPort.port === port) {
              return Promise.resolve(createPort(router, itemPort));
            }
          }
        }

        return Promise.resolve(Defaults.Void);
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
        const portObject = args.get('portObject');

        if (portObject instanceof BasicInterface) {
          const port = portObject as BasicInterface;
          return Promise.resolve(
            new CustomString(
              `${port.getVariable('port')} ${port.getVariable(
                'isClosed'
              )} ${port.getVariable('forwarded')} ${port.getVariable(
                'service'
              )}`
            )
          );
        }

        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('portObject')
  );

  return itrface;
}
