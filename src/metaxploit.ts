import {
  CustomFunction,
  CustomList,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';
import mockEnvironment from './mock/environment';
import { create as createNetSession } from './net-session';
import {
  Computer,
  File,
  Library,
  User,
  Vulnerability,
  VulnerabilityRequirements
} from './types';
import {
  getFile,
  getFileLibrary,
  getHomePath,
  getServiceLibrary,
  getTraversalPath
} from './utils';

export function create(user: User, computer: Computer): BasicInterface {
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
        const traversalPath = getTraversalPath(
          path,
          getHomePath(user, computer)
        );
        const file = getFile(computer.fileSystem, traversalPath) as File;
        const library = getFileLibrary(file);

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
        const router = mockEnvironment.getRouterByIp(ipAddress);

        if (!router) {
          return Promise.resolve(Defaults.Void);
        }

        if (port === 0) {
          return Promise.resolve(
            createNetSession(computer, router, Library.KERNEL_ROUTER)
          );
        }

        const result = mockEnvironment.getForwardedPortOfRouter(router, port);

        if (!result) {
          return Promise.resolve(Defaults.Void);
        }

        const library = getServiceLibrary(result.port.service);

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
          const exploits: Vulnerability[] = metaLib.getVariable('exploits');

          if (exploits) {
            const zones = exploits.map((x: Vulnerability) => {
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
          const exploits: Vulnerability[] = metaLib.getVariable('exploits');

          if (exploits) {
            const result = exploits
              .filter((x: Vulnerability) => {
                return x.memAddress === memAddress;
              })
              .map((x: Vulnerability) => {
                return [
                  `${x.details} <b>${x.sector}</b>. Buffer overflow.`,
                  ...x.required.map((r: VulnerabilityRequirements): string => {
                    switch (r) {
                      case VulnerabilityRequirements.LIBRARY:
                        return '* Using namespace <b>net.so</b> compiled at version <b>1.0.0.0</b>';
                      case VulnerabilityRequirements.REGISTER_AMOUNT:
                        return '* Checking registered users equal to 2.';
                      case VulnerabilityRequirements.ANY_ACTIVE:
                        return '* Checking an active user.';
                      case VulnerabilityRequirements.ROOT_ACTIVE:
                        return '* Checking root active user.';
                      case VulnerabilityRequirements.LOCAL:
                        return '* Checking existing connection in the local network.';
                      case VulnerabilityRequirements.FORWARD:
                        return '* 1337 port forwarding configured from router to the target computer.';
                      case VulnerabilityRequirements.GATEWAY:
                        return '* 1337 computers using this router as gateway.';
                    }
                    return '';
                  })
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
