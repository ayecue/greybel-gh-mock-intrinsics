import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  VM
} from 'greybel-interpreter';
import {
  MockEnvironment,
  RouterLocation,
  Type,
  Utils
} from 'greybel-mock-environment';

import { create as createFile } from './file';
import GreyMap from './grey-map';
import BasicInterface from './interface';
import { create as createPort } from './port';
import {
  greaterThanEntityNameLimit,
  greaterThanFileNameLimit,
  greaterThanFilesLimit,
  greaterThanFoldersLimit,
  isAlphaNumeric,
  isValidFileName
} from './utils';

export const getPorts = CustomFunction.createExternalWithSelf(
  'get_ports',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, mockEnvironment } = self.variables;
    const ports =
      Array.from(device.ports.values()).map((item: Type.Port) =>
        createPort(mockEnvironment, device, item)
      ) || [];
    return Promise.resolve(new CustomList(ports));
  }
);

export const getFile = CustomFunction.createExternalWithSelf(
  'File',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user, mockEnvironment } = self.variables;
    const path = args.get('path');

    if (path instanceof CustomNil) {
      throw new Error('File: Invalid arguments');
    }

    const pathRaw = path.toString();
    const target = Utils.getTraversalPath(pathRaw);
    const entityResult = device.getFile(target);

    if (!entityResult) {
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(
      createFile(mockEnvironment, user, device, entityResult)
    );
  }
).addArgument('path');

export const createFolder = CustomFunction.createExternalWithSelf(
  'create_folder',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, options, user } = self.variables;
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

      const { w } = entityResult.getPermissionsForUser(user, device.groups);

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

      return Promise.resolve(DefaultType.True);
    }

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('path')
  .addArgument('folderName');

export const isNetworkActive = CustomFunction.createExternalWithSelf(
  'is_network_active',
  (
    _vm: VM,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(DefaultType.True);
  }
);

export const getName = CustomFunction.createExternalWithSelf(
  'get_name',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(new CustomString('Unknown'));
    }

    const { device } = self.variables;
    return Promise.resolve(new CustomString(device.name));
  }
);

export const touch = CustomFunction.createExternalWithSelf(
  'touch',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, options, user } = self.variables;
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

      const { w } = entityResult.getPermissionsForUser(user, device.groups);

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
        permissions: entityResult.permissions.toString(),
        type: Type.FileType.Source
      });

      entityResult.putEntity(file);

      return Promise.resolve(DefaultType.True);
    }

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('path')
  .addArgument('fileName');

export const showProcs = CustomFunction.createExternalWithSelf(
  'show_procs',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    const result = [
      'USER PID CPU MEM COMMAND',
      ...Array.from(device.processes.values()).map((p) => {
        return `${p.owner.username} ${p.pid} ${p.cpu.toFixed(
          1
        )} ${p.mem.toFixed(2)} ${p.command}`;
      })
    ].join('\n');

    return Promise.resolve(new CustomString(result));
  }
);

export const getNetworkDevices = CustomFunction.createExternalWithSelf(
  'network_devices',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    const netDevices = [];

    for (const [type, item] of device.getNetworkDeviceMap()) {
      netDevices.push(`${type} ${item.id} ${item.active}`);
    }

    return Promise.resolve(new CustomString(netDevices.join('\n')));
  }
);

export const changePassword = CustomFunction.createExternalWithSelf(
  'change_password',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
    const username = args.get('username');
    const password = args.get('password');

    if (username instanceof CustomNil || password instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
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

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('username')
  .addArgument('password');

export const createUser = CustomFunction.createExternalWithSelf(
  'create_user',
  (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user, mockEnvironment } = self.variables;
    const username = args.get('username');
    const password = args.get('password');

    if (username instanceof CustomNil || password instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
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

    device.addUser(usernameRaw, mockEnvironment.passwordManager.create(passwordRaw));
    device.updatePasswd();
    device.createUserFolder(usernameRaw);

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('username')
  .addArgument('password');

export const deleteUser = CustomFunction.createExternalWithSelf(
  'delete_user',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
    const username = args.get('username');
    const removeHome = args.get('removeHome');

    if (username instanceof CustomNil || removeHome instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
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

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('username')
  .addArgument('removeHome', new CustomBoolean(false));

export const createGroup = CustomFunction.createExternalWithSelf(
  'create_group',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
    const username = args.get('username');
    const groupname = args.get('groupname');

    if (username instanceof CustomNil || groupname instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
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

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('username')
  .addArgument('groupname');

export const deleteGroup = CustomFunction.createExternalWithSelf(
  'delete_group',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
    const username = args.get('username');
    const groupname = args.get('groupname');

    if (username instanceof CustomNil || groupname instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
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

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('username')
  .addArgument('groupname');

export const groups = CustomFunction.createExternalWithSelf(
  'groups',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
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
).addArgument('username');

export const closeProgram = CustomFunction.createExternalWithSelf(
  'close_program',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
    const pid = args.get('pid');

    if (pid instanceof CustomNil) {
      return Promise.resolve(DefaultType.False);
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

    return Promise.resolve(DefaultType.True);
  }
).addArgument('pid');

export const wifiNetworks = CustomFunction.createExternalWithSelf(
  'wifi_networks',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, mockEnvironment } = self.variables;
    const netDevice = args.get('netDevice').toString();

    if (netDevice !== 'eth0') {
      const result: CustomString[] = mockEnvironment
        .findRoutersCloseToLocation(device.location)
        .map((item: RouterLocation) => {
          return new CustomString(
            `${item.router.mac} ${item.percentage}% ${item.router.wifi.name}`
          );
        });

      return Promise.resolve(new CustomList(result));
    }

    return Promise.resolve(DefaultType.Void);
  }
).addArgument('netDevice');

export const connectWifi = CustomFunction.createExternalWithSelf(
  'connect_wifi',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, mockEnvironment, user } = self.variables;
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
      return Promise.resolve(DefaultType.Void);
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
      return r.mac === bssidRaw && r.wifi.name === essidRaw;
    });

    if (!routerLoc) {
      return Promise.resolve(
        new CustomString("Can't connect. Router not found.")
      );
    }

    const router = routerLoc.router;
    const passwordRaw = password.toString();

    if (router.wifi.credentials.password.value !== passwordRaw) {
      return Promise.resolve(
        new CustomString("Can't connect. Incorrect password.")
      );
    }

    mockEnvironment.connect(router, device);

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('netDevice')
  .addArgument('bssid')
  .addArgument('essid')
  .addArgument('password');

export const connectEthernet = CustomFunction.createExternalWithSelf(
  'connect_ethernet',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device, user } = self.variables;
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

    if (!Utils.isValidIp(addressRaw)) {
      return Promise.resolve(new CustomString('Error: Invalid IP address'));
    } else if (!Utils.isLanIp(addressRaw)) {
      return Promise.resolve(
        new CustomString(
          'Error: the IP address and the gateway must belong to the same subnet'
        )
      );
    }

    const gatewayRaw = gateway.toString();

    if (!Utils.isValidIp(gatewayRaw)) {
      return Promise.resolve(new CustomString('Error: invalid gateway'));
    } else if (!Utils.isLanIp(gatewayRaw)) {
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

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('netDevice')
  .addArgument('address')
  .addArgument('gateway');

export const networkGateway = CustomFunction.createExternalWithSelf(
  'network_gateway',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    return Promise.resolve(new CustomString(device.getRouter().localIp));
  }
);

export const activeNetCard = CustomFunction.createExternalWithSelf(
  'active_net_card',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    const [networkDevice] = device.networkDevices.filter((n) => n.active);

    return Promise.resolve(new CustomString(networkDevice.type));
  }
);

export const getLanIp = CustomFunction.createExternalWithSelf(
  'local_ip',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    return Promise.resolve(new CustomString(device.localIp));
  }
)

export const getPublicIpPc = CustomFunction.createExternalWithSelf(
  'public_ip',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Computer.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    const router = device.getRouter();

    if (router instanceof Type.Router) {
      return Promise.resolve(new CustomString(router.publicIp));
    }

    return Promise.resolve(DefaultType.Void);
  }
);

export interface ComputerOptions {
  location?: string[];
}

export interface ComputerVariables {
  mockEnvironment: MockEnvironment;
  user: Type.User;
  device: Type.Device;
  options: ComputerOptions;
}

export class Computer extends BasicInterface {
  static readonly type: string = 'computer';
  static readonly isa: GreyMap = new GreyMap([
    getPorts,
    getFile,
    createFolder,
    isNetworkActive,
    getName,
    touch,
    showProcs,
    getNetworkDevices,
    changePassword,
    createUser,
    deleteUser,
    createGroup,
    deleteGroup,
    groups,
    closeProgram,
    wifiNetworks,
    connectWifi,
    connectEthernet,
    networkGateway,
    activeNetCard,
    getLanIp,
    getPublicIpPc
  ]);

  static retreive(args: Map<string, CustomValue>): Computer | null {
    const intf = args.get('self');
    if (intf instanceof Computer) {
      return intf;
    }
    return null;
  }

  variables: ComputerVariables;

  constructor(variables: ComputerVariables) {
    super(Computer.type, Computer.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  options: ComputerOptions = {}
): BasicInterface {
  const itrface = new Computer({
    mockEnvironment,
    user,
    device,
    options
  });

  return itrface;
}
