import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import { create as createFile } from './file';
import BasicInterface from './interface';
import { FS, Type } from 'greybel-mock-environment';
import mockEnvironment from './mock/environment';
import { create as createPort } from './port';
import {
  changePassword,
  getFile,
  getPermissions,
  getTraversalPath,
  hasFile,
  removeFile
} from './utils';

export function create(
  user: Type.User,
  computer: Type.Computer,
  options: { location?: string[] } = {}
): BasicInterface {
  const itrface = new BasicInterface('computer');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_ports',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ports =
          computer?.ports.map((item: Type.Port) => createPort(computer, item)) || [];
        return Promise.resolve(new CustomList(ports));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'File',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path').toString();
        const target = getTraversalPath(path, null);
        const entityResult = getFile(computer.fileSystem, target);

        if (!entityResult) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(createFile(user, entityResult));
      }
    ).addArgument('path')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'create_folder',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path').toString();
        const folderName = args.get('folderName').toString();
        const target = getTraversalPath(path, options.location);
        const entityResult = getFile(computer.fileSystem, target);

        if (entityResult && entityResult.isFolder) {
          const { w } = getPermissions(user, entityResult);
          const folder = entityResult as Type.Folder;

          if (w && !hasFile(folder, folderName)) {
            folder.folders.push({
              name: folderName,
              owner: user.username,
              permissions: entityResult.permissions,
              isFolder: true,
              parent: folder,
              folders: [],
              files: []
            });

            return Promise.resolve(Defaults.True);
          }
        }

        return Promise.resolve(Defaults.False);
      }
    )
      .addArgument('path')
      .addArgument('folderName')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'is_network_active',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.True);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'touch',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path').toString();
        const containingFolder = getTraversalPath(path, options.location);
        const target = args.get('fileName').toString();
        const entityResult = getFile(computer.fileSystem, containingFolder);

        if (entityResult && entityResult.isFolder) {
          const { w } = getPermissions(user, entityResult);
          const folder = entityResult as Type.Folder;

          if (w && !hasFile(folder, target)) {
            folder.files.push({
              name: target,
              owner: user.username,
              permissions: entityResult.permissions,
              type: Type.FileType.Plain,
              parent: folder
            });

            return Promise.resolve(Defaults.True);
          }
        }

        return Promise.resolve(Defaults.False);
      }
    )
      .addArgument('path')
      .addArgument('fileName')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'show_procs',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const result = [
          'USER PID CPU MEM COMMAND',
          'root 2134 0.0% 13.37% kernel_task',
          'root 1864 0.0% 4.20% Xorg'
        ].join('\n');

        return Promise.resolve(new CustomString(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'network_devices',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const result = computer.networkDevices
          .map((item: Type.NetworkDevice) => {
            return `${item.type} ${item.id} ${item.active}`;
          })
          .join('\n');

        return Promise.resolve(new CustomString(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'change_password',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (user.username === 'root') {
          const username = args.get('username').toString();
          const password = args.get('password').toString();

          return Promise.resolve(
            new CustomBoolean(changePassword(computer, username, password))
          );
        }

        return Promise.resolve(Defaults.False);
      }
    )
      .addArgument('username')
      .addArgument('password')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'create_user',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (user.username === 'root') {
          const username = args.get('username').toString();
          const password = args.get('password').toString();

          const existingUser = computer.users.find((item: Type.User) => {
            return item.username === username;
          });

          if (!existingUser) {
            const homeFolder = getFile(computer.fileSystem, ['home']) as Type.Folder;

            if (!hasFile(homeFolder, username)) {
              computer.users.push(
                mockEnvironment.get().generateUser(username, password)
              );
              homeFolder.folders.push(FS.getUserFolder(homeFolder, username));

              return Promise.resolve(Defaults.True);
            }
          }
        }

        return Promise.resolve(Defaults.False);
      }
    )
      .addArgument('username')
      .addArgument('password')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete_user',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (user.username === 'root') {
          const username = args.get('username').toString();
          const removeHome = args.get('removeHome').toTruthy();

          if (username === 'root' || username === 'guest') {
            return Promise.resolve(Defaults.False);
          }

          const userIndex = computer.users.findIndex((item: Type.User) => {
            return item.username === username;
          });

          if (userIndex !== -1) {
            computer.users.splice(userIndex, 1);

            if (removeHome) {
              const homeFolder = getFile(computer.fileSystem, [
                'home'
              ]) as Type.Folder;

              if (homeFolder) {
                removeFile(homeFolder, username);
              }
            }

            return Promise.resolve(Defaults.True);
          }
        }

        return Promise.resolve(Defaults.False);
      }
    )
      .addArgument('username')
      .addArgument('removeHome', new CustomBoolean(true))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'create_group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // g is ignored for now
        // todo: add group logic
        return Promise.resolve(Defaults.False);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete_group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // g is ignored for now
        // todo: add group logic
        return Promise.resolve(Defaults.False);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'groups',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // g is ignored for now
        // todo: add group logic
        return Promise.resolve(new CustomString(''));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'close_program',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // programs are not supported for now
        if (user.username !== 'root') {
          return Promise.resolve(Defaults.False);
        }

        return Promise.resolve(new CustomBoolean(Math.random() < 0.5));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'wifi_networks',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const result = mockEnvironment.get().networks.map((item: Type.Network) => {
          return new CustomString(
            `${item.mac} ${item.percentage}% ${item.name}`
          );
        });

        return Promise.resolve(new CustomList(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'connect_wifi',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // connect_wifi will always default to the standart one for now
        return Promise.resolve(Defaults.True);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'connect_ethernet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        // connect_ethernet not yet supported
        return Promise.resolve(Defaults.False);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'network_gateway',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(computer.localIp));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'active_net_card',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('WIFI'));
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
        return Promise.resolve(new CustomString(computer.localIp));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'public_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(
          new CustomString(
            computer.router?.publicIp || (computer as Type.Router).publicIp
          )
        );
      }
    )
  );

  return itrface;
}
