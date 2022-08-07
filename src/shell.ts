import {
  CustomFunction,
  CustomInterface,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import { create as createComputer } from './computer';
import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { Computer, File, Folder, Port, Service, User } from './types';
import {
  getFile,
  getHomePath,
  getPermissions,
  getTraversalPath,
  putFile
} from './utils';

export function create(
  user: User,
  computer: Computer,
  options: { port?: Port; location?: string[] } = {}
): CustomInterface {
  const activePort = options.port
    ? computer.ports.find((item) => item.port === options.port.port)
    : null;
  const currentService =
    activePort?.service === Service.FTP ? Service.FTP : Service.SSH;
  const currentLocation = options.location || getHomePath(user, computer);
  const itrface = new BasicInterface(
    Service.SSH === currentService ? 'shell' : 'ftpShell'
  );

  if (currentService === Service.SSH) {
    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'connect_service',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          const ip = args.get('ip').toString();
          const port = args.get('port').toInt();
          const user = args.get('user').toString();
          const password = args.get('password').toString();
          // const service = args.get('service').toString();

          let resultPort: Port | null;
          let resultUser: User | null;
          const computers = mockEnvironment.getComputersOfRouterByIp(ip);
          const resultComputer = computers.find((item) => {
            if (item.router.publicIp !== ip) {
              return false;
            }

            for (const portItem of item.ports) {
              if (
                (portItem.service === Service.SSH ||
                  portItem.service === Service.FTP) &&
                portItem.port === port
              ) {
                resultPort = portItem;
                break;
              }
            }

            if (!resultPort) {
              return false;
            }

            for (const itemUser of item.users) {
              if (
                itemUser.username === user &&
                itemUser.password === password
              ) {
                resultUser = itemUser;
                break;
              }
            }

            if (!resultUser) {
              return false;
            }

            return false;
          });

          if (resultPort && resultUser) {
            return Promise.resolve(
              create(resultUser, resultComputer, {
                port: resultPort
              })
            );
          }

          return Promise.resolve(new CustomString('Invalid connection.'));
        }
      )
        .addArgument('ip')
        .addArgument('port')
        .addArgument('user')
        .addArgument('password')
        .addArgument('service')
    );

    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'scp',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          const pathOrig = args.get('pathOrig').toString();
          const pathDest = args.get('pathDest').toString();
          const remoteShell = args.get('remoteShell');

          if (
            remoteShell instanceof BasicInterface &&
            remoteShell.getCustomType() === 'shell'
          ) {
            const rshell = remoteShell as BasicInterface;
            const traversalPath = getTraversalPath(pathOrig, currentLocation);
            const localFile = getFile(computer.fileSystem, traversalPath);
            const remoteTraversalPath = getTraversalPath(
              pathDest,
              rshell.getVariable('currentLocation')
            );
            const remoteFile = getFile(
              rshell.getVariable('computer').fileSystem,
              remoteTraversalPath
            );

            if (!localFile) {
              return Promise.resolve(
                new CustomString('pathOrig does not exist.')
              );
            }

            if (!remoteFile) {
              return Promise.resolve(
                new CustomString('pathDest does not exist.')
              );
            }

            const { r } = getPermissions(user, localFile);

            if (!r) {
              return Promise.resolve(
                new CustomString('No read permissions for pathOrig.')
              );
            }

            const { w } = getPermissions(
              rshell.getVariable('user'),
              remoteFile
            );

            if (!w) {
              return Promise.resolve(
                new CustomString('No write permissions for pathDest.')
              );
            }

            putFile(remoteFile as Folder, localFile as File);
            return Promise.resolve(Defaults.True);
          }

          return Promise.resolve(
            new CustomString('Invalid remote shell object.')
          );
        }
      )
        .addArgument('pathOrig')
        .addArgument('pathDest')
        .addArgument('remoteShell')
    );

    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'build',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          _args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          return Promise.resolve(new CustomString('Not yet supported.'));
        }
      )
    );

    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'launch',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          _args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          return Promise.resolve(new CustomString('Not yet supported.'));
        }
      )
    );

    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'ping',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          const ip = args.get('ipAddress').toString();
          const router = mockEnvironment.getRouterByIp(ip);

          if (router) {
            return Promise.resolve(Defaults.True);
          }

          return Promise.resolve(Defaults.Void);
        }
      ).addArgument('ipAddress')
    );

    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'masterkey',
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
        'masterkey_direct',
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
        'restore_network',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          _args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          return Promise.resolve(Defaults.Void);
        }
      )
    );
  } else if (currentService === Service.FTP) {
    itrface.addMethod(
      CustomFunction.createExternalWithSelf(
        'put',
        (
          _ctx: OperationContext,
          _self: CustomValue,
          _args: Map<string, CustomValue>
        ): Promise<CustomValue> => {
          return Promise.resolve(new CustomString('Not yet supported.'));
        }
      )
    );
  }

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'start_terminal',
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
      'host_computer',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(
          createComputer(user, computer, { location: currentLocation })
        );
      }
    )
  );

  itrface.setVariable('user', user);
  itrface.setVariable('computer', computer);
  itrface.setVariable('currentLocation', currentLocation);

  return itrface;
}

export function loginLocal(
  user: CustomValue,
  password: CustomValue
): CustomValue {
  const computer = mockEnvironment.getLocal().computer;

  const usr = user.toString();
  const pwd = password.toString();

  if (!usr && !pwd) {
    return create(mockEnvironment.getLocal().user, computer);
  }

  for (const item of computer.users) {
    if (item.username === usr && item.password === pwd) {
      return create(item, computer);
    }
  }

  return Defaults.Void;
}
