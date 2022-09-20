import {
  CustomFunction,
  CustomList,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { Type, Utils } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';
import mockEnvironment from './mock/environment';
import { create as createNetSession } from './net-session';

export function create(
  user: Type.User,
  computer: Type.Computer
): BasicInterface {
  const itrface = new BasicInterface('metaxploit');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'load',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path').toString();
        const traversalPath = Utils.getTraversalPath(
          path,
          computer.getHomePath(user)
        );
        const file = computer.getFile(traversalPath) as Type.File;
        const library = file.getLibraryType();

        if (!library) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(createMetaLib(computer, computer, library));
      }
    ).addArgument('path')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'net_use',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ipAddress = args.get('ipAddress').toString();
        const port = args.get('port').toInt();
        const router = mockEnvironment.get().getRouterByIp(ipAddress);

        if (!router) {
          return Promise.resolve(Defaults.Void);
        }

        if (port === 0) {
          return Promise.resolve(
            createNetSession(computer, router, Type.Library.KERNEL_ROUTER)
          );
        }

        const result = mockEnvironment
          .get()
          .getForwardedPortOfRouter(router, port);

        if (!result) {
          return Promise.resolve(Defaults.Void);
        }

        const library = Utils.getServiceLibrary(result.port.service);

        if (!library) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(
          createNetSession(computer, result.computer, library)
        );
      }
    )
      .addArgument('ipAddress')
      .addArgument('port', new CustomNumber(0))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'scan',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const metaLib = args.get('metaLib');
        if (metaLib instanceof BasicInterface) {
          const exploits: Type.Vulnerability[] =
            metaLib.getVariable('exploits');

          if (exploits) {
            const zones = exploits.map((x: Type.Vulnerability) => {
              return x.memAddress;
            });
            const result = Array.from(new Set(zones)).map(
              (item) => new CustomString(item)
            );

            return Promise.resolve(new CustomList(result));
          }
        }

        return Promise.resolve(new CustomList());
      }
    ).addArgument('metaLib')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'scan_address',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const metaLib = args.get('metaLib');
        const memAddress = args.get('memAddress').toString();
        if (metaLib instanceof BasicInterface) {
          const exploits: Type.Vulnerability[] =
            metaLib.getVariable('exploits');

          if (exploits) {
            const result = exploits
              .filter((x: Type.Vulnerability) => {
                return x.memAddress === memAddress;
              })
              .map((x: Type.Vulnerability) => {
                return [
                  `${x.details} <b>${x.sector}</b>. Buffer overflow.`,
                  ...x.required.map(
                    (r: Type.VulnerabilityRequirements): string => {
                      switch (r) {
                        case Type.VulnerabilityRequirements.LIBRARY:
                          return '* Using namespace <b>net.so</b> compiled at version <b>1.0.0.0</b>';
                        case Type.VulnerabilityRequirements.REGISTER_AMOUNT:
                          return '* Checking registered users equal to 2.';
                        case Type.VulnerabilityRequirements.ANY_ACTIVE:
                          return '* Checking an active user.';
                        case Type.VulnerabilityRequirements.ROOT_ACTIVE:
                          return '* Checking root active user.';
                        case Type.VulnerabilityRequirements.LOCAL:
                          return '* Checking existing connection in the local network.';
                        case Type.VulnerabilityRequirements.FORWARD:
                          return '* 1337 port forwarding configured from router to the target computer.';
                        case Type.VulnerabilityRequirements.GATEWAY:
                          return '* 1337 computers using this router as gateway.';
                      }
                      return '';
                    }
                  )
                ].join('\n');
              })
              .join('\n');

            return Promise.resolve(new CustomString(result));
          }
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('metaLib')
      .addArgument('memAddress')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'sniffer',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('No yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'rshell_client',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.False);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'rshell_server',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomList());
      }
    )
  );

  return itrface;
}
