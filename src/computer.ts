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
import {
  MockEnvironment,
  RouterLocation,
  Type,
  Utils
} from 'greybel-mock-environment';

import { create as createFile } from './file';
import BasicInterface from './interface';
import { create as createPort } from './port';
import {
  formatColumns,
  greaterThanEntityNameLimit,
  greaterThanFileNameLimit,
  greaterThanFilesLimit,
  greaterThanFoldersLimit,
  isAlphaNumeric,
  isValidFileName
} from './utils';

export function create(
  mockEnvironment: MockEnvironment,
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
            createPort(mockEnvironment, device, item)
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

        return Promise.resolve(
          createFile(mockEnvironment, user, device, entityResult)
        );
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
        const path = args.get('path');
        const folderName = args.get('folderName');

        if (path instanceof CustomNil || folderName instanceof CustomNil) {
          return Promise.resolve(
            new CustomString('create_folder: Invalid arguments')
          );
        }

        const pathRaw = path.toString();
        const folderNameRaw = folderName.toString();

        if (!isValidFileName(folderNameRaw)) {
          return Promise.resolve(
            new CustomString('Error: only aplhanumeric allowed as folder name.')
          );
        } else if (greaterThanFileNameLimit(folderNameRaw)) {
          return Promise.resolve(
            new CustomString(
              'Error: name cannot exceed the limit of 128 characters.'
            )
          );
        }

        const containingFolder = Utils.getTraversalPath(
          pathRaw,
          options.location
        );
        const target = folderName.toString();
        const entityResult = device.getFile(containingFolder);

        if (entityResult === null) {
          return Promise.resolve(new CustomString('Error: invalid path'));
        }

        if (entityResult instanceof Type.Folder) {
          if (entityResult.hasEntity(target)) {
            return Promise.resolve(
              new CustomString('The folder already exists')
            );
          } else if (greaterThanFoldersLimit(entityResult.folders)) {
            return Promise.resolve(
              new CustomString(
                "Can't create folder. Reached maximum number of files in a folder"
              )
            );
          }

          const { w } = entityResult.getPermissions(user, device.groups);

          if (!w && user.username !== 'root') {
            return Promise.resolve(
              new CustomString(
                `Can't create folder ${entityResult.getPath()}/${folderNameRaw}. Permission denied`
              )
            );
          }

          const folder = new Type.Folder({
            name: target,
            owner: user.username,
            permissions: entityResult.permissions.toString()
          });

          entityResult.putEntity(folder);

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
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
        const path = args.get('path');
        const fileName = args.get('fileName');

        if (path instanceof CustomNil) {
          return Promise.resolve(new CustomString('Error: invalid path'));
        } else if (fileName instanceof CustomNil) {
          return Promise.resolve(
            new CustomString('Error: nameFile must be string')
          );
        }

        const pathRaw = path.toString();
        const fileNameRaw = fileName.toString();

        if (!isValidFileName(fileNameRaw)) {
          return Promise.resolve(
            new CustomString('Error: only aplhanumeric allowed as file name.')
          );
        } else if (greaterThanFileNameLimit(fileNameRaw)) {
          return Promise.resolve(
            new CustomString(
              'Error: name cannot exceed the limit of 128 characters.'
            )
          );
        }

        const containingFolder = Utils.getTraversalPath(
          pathRaw,
          options.location
        );
        const target = fileName.toString();
        const entityResult = device.getFile(containingFolder);

        if (entityResult === null) {
          return Promise.resolve(new CustomString('Error: invalid path'));
        }

        if (entityResult instanceof Type.Folder) {
          if (entityResult.hasEntity(target)) {
            return Promise.resolve(new CustomString('The file already exists'));
          } else if (greaterThanFilesLimit(entityResult.files)) {
            return Promise.resolve(
              new CustomString("Can't create file. Reached maximum limit")
            );
          }

          const { w } = entityResult.getPermissions(user, device.groups);

          if (!w && user.username !== 'root') {
            return Promise.resolve(
              new CustomString(
                `Can't create file ${entityResult.getPath()}/${fileNameRaw}. Permission denied`
              )
            );
          }

          const file = new Type.File({
            name: target,
            owner: user.username,
            permissions: `-${entityResult.permissions.toString().slice(1)}`,
            type: Type.FileType.Source
          });

          entityResult.putEntity(file);

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
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
          ...Array.from(device.processes.values()).map((p) => {
            return `${p.owner.username} ${p.pid} ${p.cpu.toFixed(
              1
            )} ${p.mem.toFixed(2)} ${p.command}`;
          })
        ].join('\n')

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
        const netDevices = [];

        for (const [type, item] of device.getNetworkDeviceMap()) {
          netDevices.push(`${type} ${item.id} ${item.active}`);
        }

        return Promise.resolve(new CustomString(netDevices.join('\n')));
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
        } else if (!isAlphaNumeric(passwordRaw)) {
          return Promise.resolve(
            new CustomString('Error: only alphanumeric allowed as password.')
          );
        } else if (greaterThanEntityNameLimit(passwordRaw)) {
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

        if (!device.users.has(usernameRaw)) {
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
        const username = args.get('username');
        const password = args.get('password');

        if (username instanceof CustomNil || password instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const usernameRaw = username.toString();
        const passwordRaw = password.toString();

        if (usernameRaw === '') {
          throw new Error('create_user: Invalid arguments');
        } else if (greaterThanEntityNameLimit(usernameRaw)) {
          throw new Error('username cannot exceed the 15 character limit.');
        } else if (greaterThanEntityNameLimit(passwordRaw)) {
          throw new Error('password cannot exceed the 15 character limit.');
        } else if (
          !isAlphaNumeric(usernameRaw) ||
          !isAlphaNumeric(passwordRaw)
        ) {
          return Promise.resolve(
            new CustomString(
              'Error: only alphanumeric allowed as user name and password.'
            )
          );
        } else if (user.username !== 'root') {
          return Promise.resolve(
            new CustomString('Denied. Only root user can execute this command.')
          );
        } else if (device.users.size >= 16) {
          return Promise.resolve(
            new CustomString(
              'Denied. Maximum number of registered users reached.'
            )
          );
        }

        device.addUser(usernameRaw, passwordRaw);
        device.updatePasswd();
        device.createUserFolder(usernameRaw);

        return Promise.resolve(Defaults.True);
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
        const username = args.get('username');
        const removeHome = args.get('removeHome');

        if (username instanceof CustomNil || removeHome instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const usernameRaw = username.toString();
        const removeHomeRaw = removeHome.toTruthy();

        if (usernameRaw === '') {
          throw new Error('delete_user: Invalid arguments');
        } else if (user.username !== 'root') {
          return Promise.resolve(
            new CustomString('Denied. Only root user can execute this command.')
          );
        }

        if (!device.users.has(usernameRaw)) {
          return Promise.resolve(
            new CustomString(`can't delete user. ${usernameRaw} does not exist`)
          );
        }

        const target = device.users.get(usernameRaw);

        if (target.username === 'root') {
          return Promise.resolve(
            new CustomString("the root user can't be deleted")
          );
        }

        device.removeUser(usernameRaw);

        if (removeHomeRaw) {
          const folder = device.getFile(['home', usernameRaw]);
          folder?.delete();
        }

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('username')
      .addArgument('removeHome', new CustomBoolean(false))
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
        } else if (greaterThanEntityNameLimit(groupnameRaw)) {
          throw new Error('groupname cannot exceed the 15 character limit');
        } else if (!isAlphaNumeric(usernameRaw)) {
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

        if (!device.users.has(usernameRaw)) {
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

        if (!device.users.has(usernameRaw)) {
          return Promise.resolve(
            new CustomString(`Error: user ${usernameRaw} does not exist`)
          );
        }

        if (!device.groups.has(groupnameRaw)) {
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

        if (!device.users.has(usernameRaw)) {
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
            .findRoutersCloseToLocation(device.location)
            .map((item: RouterLocation) => {
              return new CustomString(
                `${item.router.bssid} ${item.percentage}% ${item.router.essid}`
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
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const netDevice = args.get('netDevice');
        const bssid = args.get('bssid');
        const essid = args.get('essid');
        const password = args.get('password');

        if (
          netDevice instanceof CustomNil ||
          bssid instanceof CustomNil ||
          essid instanceof CustomNil ||
          password instanceof CustomNil
        ) {
          return Promise.resolve(Defaults.Void);
        }

        if (user.username === 'guest') {
          return Promise.resolve(
            new CustomString(
              'connect_wifi: permission denied. Guest users can not execute this method'
            )
          );
        }

        const netDeviceRaw = netDevice.toString();
        const netDeviceMap = device.getNetworkDeviceMap();

        if (!netDeviceMap.has(netDeviceRaw)) {
          return Promise.resolve(
            new CustomString('connect_wifi: Network device not found')
          );
        }

        const netDeviceInstance = netDeviceMap.get(netDeviceRaw);

        if (netDeviceInstance.type !== Type.NetCard.Wifi) {
          return Promise.resolve(
            new CustomString('connect_wifi: Only wifi cards are supported')
          );
        }

        const bssidRaw = bssid.toString();
        const essidRaw = essid.toString();
        const closeRouters: RouterLocation[] =
          mockEnvironment.findRoutersCloseToLocation(device.location);
        const routerLoc = closeRouters.find((item: RouterLocation) => {
          const r = item.router;
          return r.bssid === bssidRaw && r.essid === essidRaw;
        });

        if (!routerLoc) {
          return Promise.resolve(
            new CustomString("Can't connect. Router not found.")
          );
        }

        const router = routerLoc.router;
        const passwordRaw = password.toString();

        if (router.wifi.credentials.password !== passwordRaw) {
          return Promise.resolve(
            new CustomString("Can't connect. Incorrect password.")
          );
        }

        mockEnvironment.connect(router, device);

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('netDevice')
      .addArgument('bssid')
      .addArgument('essid')
      .addArgument('password')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'connect_ethernet',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const netDevice = args.get('netDevice');
        const address = args.get('address');
        const gateway = args.get('gateway');

        if (
          netDevice instanceof CustomNil ||
          address instanceof CustomNil ||
          gateway instanceof CustomNil
        ) {
          throw new Error('connect_ethernet: Invalid arguments');
        } else if (user.username === 'guest') {
          return Promise.resolve(
            new CustomString(
              'connect_ethernet: permission denied. Guest users can not execute this method'
            )
          );
        }

        const addressRaw = address.toString();

        if (Utils.isValidIp(addressRaw)) {
          return Promise.resolve(new CustomString('Error: Invalid IP address'));
        } else if (Utils.isLanIp(addressRaw)) {
          return Promise.resolve(
            new CustomString(
              'Error: the IP address and the gateway must belong to the same subnet'
            )
          );
        }

        const gatewayRaw = gateway.toString();

        if (Utils.isValidIp(gatewayRaw)) {
          return Promise.resolve(new CustomString('Error: invalid gateway'));
        } else if (Utils.isLanIp(gatewayRaw)) {
          return Promise.resolve(
            new CustomString(
              'Error: the IP address and the gateway must belong to the same subnet'
            )
          );
        }

        const netDeviceRaw = netDevice.toString();
        const netDeviceMap = device.getNetworkDeviceMap();

        if (!netDeviceMap.has(netDeviceRaw)) {
          return Promise.resolve(
            new CustomString('connect_ethernet: Network device not found')
          );
        }

        const netDeviceInstance = netDeviceMap.get(netDeviceRaw);

        if (netDeviceInstance.type !== Type.NetCard.Ethernet) {
          return Promise.resolve(
            new CustomString(
              'connect_ethernet: Only ethernet cards are supported'
            )
          );
        }

        const router = device.getRouter();

        if (router instanceof Type.Router) {
          router.changeIp(addressRaw, gatewayRaw);
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('netDevice')
      .addArgument('address')
      .addArgument('gateway')
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
        const [networkDevice] = device.networkDevices.filter((n) => n.active);

        return Promise.resolve(new CustomString(networkDevice.type));
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
