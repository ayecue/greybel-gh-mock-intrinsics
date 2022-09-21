import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { FS, Type, Utils } from 'greybel-mock-environment';

import { create as createFile } from './file';
import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { create as createPort } from './port';

export function create(
  user: Type.User,
  device: Type.Device,
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
          Array.from(device.ports.values()).map((item: Type.Port) =>
            createPort(device, item)
          ) || [];
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
        const target = Utils.getTraversalPath(path, null);
        const entityResult = device.getFile(target);

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
        const target = Utils.getTraversalPath(path, options.location);
        const entityResult = device.getFile(target);

        if (entityResult && entityResult.isFolder) {
          const { w } = entityResult.getPermissions(user);
          const folder = entityResult as Type.Folder;

          if (w && !folder.hasFile(folderName)) {
            folder.folders.push(
              new Type.Folder(
                {
                  name: folderName,
                  owner: user.username,
                  permissions: entityResult.permissions,
                  folders: [],
                  files: []
                },
                folder
              )
            );

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
        const containingFolder = Utils.getTraversalPath(path, options.location);
        const target = args.get('fileName').toString();
        const entityResult = device.getFile(containingFolder);

        if (entityResult && entityResult.isFolder) {
          const { w } = entityResult.getPermissions(user);
          const folder = entityResult as Type.Folder;

          if (w && !folder.hasFile(target)) {
            folder.files.push(
              new Type.File(
                {
                  name: target,
                  owner: user.username,
                  permissions: entityResult.permissions,
                  type: Type.FileType.Plain
                },
                folder
              )
            );

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
        const result = device.networkDevices
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
            new CustomBoolean(device.changePassword(username, password))
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

          const existingUser = device.users.find((item: Type.User) => {
            return item.username === username;
          });

          if (!existingUser) {
            const homeFolder = device.getFile(['home']) as Type.Folder;

            if (!homeFolder.hasFile(username)) {
              device.users.push(
                mockEnvironment.get().userGenerator.generate(username, password)
              );
              homeFolder.folders.push(
                FS.getUserFolder(
                  {
                    parent: homeFolder,
                    users: device.users,
                    type: device.getDeviceType(),
                    ownerType: FS.FSDeviceOwnerType.Player
                  },
                  username
                )
              );

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

          const userIndex = device.users.findIndex((item: Type.User) => {
            return item.username === username;
          });

          if (userIndex !== -1) {
            device.users.splice(userIndex, 1);

            if (removeHome) {
              const homeFolder = device.getFile(['home']) as Type.Folder;

              if (homeFolder) {
                homeFolder.removeFile(username);
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
        const result = mockEnvironment
          .get()
          .networkGenerator.wifiNetworks.map((item: Type.WifiNetwork) => {
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
        return Promise.resolve(new CustomString(device.localIp));
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
        return Promise.resolve(new CustomString(device.localIp));
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
        if (device instanceof Type.Computer || device instanceof Type.Switch) {
          return Promise.resolve(new CustomString(device.router.publicIp));
        } else if (device instanceof Type.Router) {
          return Promise.resolve(new CustomString(device.publicIp));
        }

        return Promise.resolve(Defaults.Void);
      }
    )
  );

  return itrface;
}
