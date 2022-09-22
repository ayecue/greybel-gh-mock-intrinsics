import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { FS, RouterLocation, Type, Utils } from 'greybel-mock-environment';

import { create as createFile } from './file';
import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { create as createPort } from './port';
import { formatColumns, isAlphaNumeric } from './utils';

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
        const path = args.get('path');

        if (path instanceof CustomNil) {
          throw new Error('File: Invalid arguments');
        }

        const pathRaw = path.toString();
        const target = Utils.getTraversalPath(pathRaw);
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
        const result = formatColumns(
          [
            'USER PID CPU MEM COMMAND',
            ...Array.from(device.processes.values()).map((p) => {
              return `${p.owner.username} ${p.pid} ${p.cpu.toFixed(
                1
              )} ${p.mem.toFixed(2)} ${p.command}`;
            })
          ].join('\n')
        );

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
        let wifiIndex = 0;
        let ethIndex = 0;
        const result = device.networkDevices
          .map((item: Type.NetworkDevice) => {
            let type;

            if (item.type === Type.NetCard.Wifi) {
              type = `wlan${wifiIndex++}`;
            } else {
              type = `eth${ethIndex++}`;
            }

            return `${type} ${item.id} ${item.active}`;
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
        const username = args.get('username');
        const password = args.get('password');

        if (username instanceof CustomNil || password instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const usernameRaw = username.toString();
        const passwordRaw = password.toString();

        if (usernameRaw === '') {
          throw new Error('change_password: Invalid arguments');
        } else if (isAlphaNumeric(passwordRaw)) {
          return Promise.resolve(
            new CustomString('Error: only alphanumeric allowed as password.')
          );
        } else if (passwordRaw.length > 15) {
          return Promise.resolve(
            new CustomString(
              'Error: the password cannot exceed the limit of 15 characters.'
            )
          );
        }

        if (user.username !== 'root') {
          return Promise.resolve(
            new CustomString('Denied. Only root user can execute this command.')
          );
        }

        const target = device.findUser(usernameRaw);

        if (target === null) {
          return Promise.resolve(
            new CustomString(`user ${usernameRaw} does not exist`)
          );
        }

        device.changePassword(usernameRaw, passwordRaw);

        return Promise.resolve(Defaults.True);
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
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const username = args.get('username');
        const groupname = args.get('groupname');

        if (username instanceof CustomNil || groupname instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const usernameRaw = username.toString();
        const groupnameRaw = groupname.toString();

        if (usernameRaw === '' || groupnameRaw === '') {
          throw new Error('create_group: Invalid arguments');
        } else if (groupnameRaw.length > 15) {
          throw new Error('groupname cannot exceed the 15 character limit');
        } else if (isAlphaNumeric(usernameRaw)) {
          return Promise.resolve(
            new CustomString(
              'Error: only alphanumeric allowed as user and group names.'
            )
          );
        }

        if (user.username !== 'root') {
          return Promise.resolve(
            new CustomString('Denied. Only root user can execute this command.')
          );
        }

        const target = device.findUser(usernameRaw);

        if (target === null) {
          return Promise.resolve(
            new CustomString(`Error: user ${usernameRaw} does not exist`)
          );
        }

        device.addGroup(usernameRaw, groupnameRaw);

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('username')
      .addArgument('groupname')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete_group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const username = args.get('username');
        const groupname = args.get('groupname');

        if (username instanceof CustomNil || groupname instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const usernameRaw = username.toString();
        const groupnameRaw = groupname.toString();

        if (usernameRaw === '' || groupnameRaw === '') {
          throw new Error('delete_group: Invalid arguments');
        } else if (user.username !== 'root') {
          return Promise.resolve(
            new CustomString('Denied. Only root user can execute this command.')
          );
        }

        const target = device.findUser(usernameRaw);

        if (target === null) {
          return Promise.resolve(
            new CustomString(`Error: user ${usernameRaw} does not exist`)
          );
        } else if (!device.groups.has(groupnameRaw)) {
          return Promise.resolve(
            new CustomString(
              `Error: group ${groupnameRaw} not found in user ${usernameRaw}`
            )
          );
        }

        device.removeGroup(usernameRaw, groupnameRaw);

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('username')
      .addArgument('groupname')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'groups',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const username = args.get('username');

        if (username instanceof CustomNil) {
          throw new Error('groups: Invalid arguments');
        }

        const usernameRaw = username.toString();
        const target = device.findUser(usernameRaw);

        if (target === null) {
          return Promise.resolve(
            new CustomString(`Error: user ${usernameRaw} does not exist.`)
          );
        }

        const groups = [];

        for (const [name, groupUsers] of device.groups.entries()) {
          if (groupUsers.has(usernameRaw)) {
            groups.push(name);
          }
        }

        return Promise.resolve(new CustomString(groups.join('\n')));
      }
    ).addArgument('username')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'close_program',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const pid = args.get('pid');

        if (pid instanceof CustomNil) {
          return Promise.resolve(Defaults.False);
        }

        const pidNum = pid.toNumber();

        if (device.processes.has(pidNum)) {
          const process = device.processes.get(pidNum);

          if (
            user.username !== 'root' &&
            process.owner.username !== user.username
          ) {
            return Promise.resolve(
              new CustomString(
                `Permission denied. PID ${pidNum} belongs to user <b>${process.owner.username}</b>`
              )
            );
          } else if (process.protected) {
            return Promise.resolve(
              new CustomString('Permission denied. Process protected.')
            );
          }
        }

        device.removeProcess(pidNum);

        return Promise.resolve(Defaults.True);
      }
    ).addArgument('pid')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'wifi_networks',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const netDevice = args.get('netDevice').toString();

        if (netDevice !== 'eth0') {
          const result: CustomString[] = mockEnvironment
            .get()
            .findRoutersCloseToLocation(device.location)
            .map((item: RouterLocation) => {
              return new CustomString(
                `${item.router.mac} ${item.percentage}% ${item.router.wifi.name}`
              );
            });

          return Promise.resolve(new CustomList(result));
        }

        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('netDevice')
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
        return Promise.resolve(new CustomString(device.getRouter().localIp));
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
        return Promise.resolve(new CustomString(device.activeNetCard));
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
        const router = device.getRouter();

        if (router instanceof Type.Router) {
          return Promise.resolve(new CustomString(router.publicIp));
        }

        return Promise.resolve(Defaults.Void);
      }
    )
  );

  return itrface;
}
