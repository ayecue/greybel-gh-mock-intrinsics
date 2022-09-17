import actualMd5 from 'blueimp-md5';
import {
  CustomBoolean,
  CustomFunction,
  CustomNil,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { Type } from 'greybel-mock-environment';

import { create as createAptClient } from './apt-client';
import { create as createBlockchain } from './blockchain';
import { create as createCrypto } from './crypto';
import { create as createMetaMail } from './meta-mail';
import { create as createMetaxploit } from './metaxploit';
import mockEnvironment from './mock/environment';
import { create as createRouter } from './router';
import { create as createService } from './service';
import { loginLocal } from './shell';
import {
  getFile,
  getHomePath,
  getPermissions,
  getTraversalPath
} from './utils';

export const getShell = CustomFunction.createExternal(
  'getShell',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const user = args.get('user');
    const password = args.get('password');

    if (user instanceof CustomNil || password instanceof CustomNil) {
      throw new Error('get_shell: Invalid arguments');
    }

    return Promise.resolve(loginLocal(user, password));
  }
)
  .addArgument('user', new CustomString(''))
  .addArgument('password', new CustomString(''));

export const mailLogin = CustomFunction.createExternal(
  'mailLogin',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const user = args.get('user');
    const password = args.get('password');
    const email = mockEnvironment
      .get()
      .getEmailViaLogin(user.toString(), password.toString());

    if (!email) {
      return Promise.resolve(Defaults.Void);
    }

    return Promise.resolve(createMetaMail(email));
  }
)
  .addArgument('user')
  .addArgument('password');

export const getRouter = CustomFunction.createExternal(
  'getRouter',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const { user, computer } = mockEnvironment.get().getLocal();
    const target = args.get('ipAddress').toString();
    const router = mockEnvironment
      .get()
      .getRouterByIp(target || computer.router?.publicIp);

    return Promise.resolve(createRouter(user, router || computer.router));
  }
).addArgument('ipAddress');

export const getSwitch = CustomFunction.createExternal(
  'getSwitch',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const { user, computer } = mockEnvironment.get().getLocal();
    const target = args.get('ipAddress').toString();
    const router = mockEnvironment
      .get()
      .getRouterByIp(target || computer.router?.publicIp);

    return Promise.resolve(createRouter(user, router || computer.router));
  }
).addArgument('ipAddress');

export const includeLib = CustomFunction.createExternal(
  'includeLib',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const libPath = args.get('libPath');

    if (libPath instanceof CustomNil && libPath.toString() === '') {
      throw new Error('include_lib: Invalid arguments');
    }

    const { user, computer } = mockEnvironment.get().getLocal();
    const target = getTraversalPath(libPath.toString(), null);
    const entityResult = getFile(computer.fileSystem, target);

    if (entityResult && !entityResult.isFolder) {
      const { r } = getPermissions(user, entityResult);

      if (r) {
        switch ((entityResult as Type.File).type) {
          case Type.FileType.SSH:
          case Type.FileType.FTP:
          case Type.FileType.HTTP:
          case Type.FileType.Chat:
          case Type.FileType.RShell:
          case Type.FileType.Repository:
            return Promise.resolve(createService(user, computer));
          case Type.FileType.AptClient:
            return Promise.resolve(createAptClient(user, computer));
          case Type.FileType.Crypto:
            return Promise.resolve(createCrypto(user, computer));
          case Type.FileType.Metaxploit:
            return Promise.resolve(createMetaxploit(user, computer));
          case Type.FileType.Blockchain:
            return Promise.resolve(createBlockchain(user, computer));
          default:
        }
      }
    }

    return Promise.resolve(Defaults.Void);
  }
).addArgument('libPath');

export const md5 = CustomFunction.createExternal(
  'md5',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const value = args.get('value');
    if (value instanceof CustomString) {
      return Promise.resolve(new CustomString(actualMd5(value.toString())));
    }
    return Promise.resolve(Defaults.Void);
  }
).addArgument('value');

export const time = CustomFunction.createExternal(
  'time',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(new CustomNumber(Date.now()));
  }
);

export const nslookup = CustomFunction.createExternal(
  'nslookup',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const target = args.get('hostname').toString();
    const router = mockEnvironment.get().findRouterViaNS(target);
    return Promise.resolve(new CustomString(router?.publicIp));
  }
).addArgument('hostname');

export const whois = CustomFunction.createExternal(
  'whois',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const ipAddress = args.get('ipAddress');

    if (ipAddress instanceof CustomNil) {
      throw new Error('whois: Invalid arguments');
    }

    const target = ipAddress.toString();

    if (target === '') {
      throw new Error('whois: Invalid arguments');
    }

    if (!mockEnvironment.get().isValidIp(target)) {
      return Promise.resolve(new CustomString(`Invalid IP adress ${target}`));
    }

    if (mockEnvironment.get().isLanIp(target)) {
      return Promise.resolve(
        new CustomString('Error: the IP address must be public')
      );
    }

    const router = mockEnvironment.get().getRouterByIp(target);

    if (router) {
      return Promise.resolve(new CustomString(router.whoisDescription));
    }

    return Promise.resolve(new CustomString('Address not found'));
  }
).addArgument('ipAddress');

export const isValidIp = CustomFunction.createExternal(
  'isValidIp',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const target = args.get('ipAddress').toString();
    return Promise.resolve(
      new CustomBoolean(mockEnvironment.get().isValidIp(target))
    );
  }
).addArgument('ipAddress');

export const isLanIp = CustomFunction.createExternal(
  'isLanIp',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const target = args.get('ipAddress').toString();
    return Promise.resolve(
      new CustomBoolean(
        mockEnvironment.get().isValidIp(target) &&
          mockEnvironment.get().isLanIp(target)
      )
    );
  }
).addArgument('ipAddress');

export const commandInfo = CustomFunction.createExternal(
  'commandInfo',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(
      new CustomString(args.get('idCommand').toString().toUpperCase())
    );
  }
).addArgument('idCommand');

export const currentDate = CustomFunction.createExternal(
  'currentDate',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const date = new Date(Date.now());
    const result = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    return Promise.resolve(new CustomString(result));
  }
);

export const currentPath = CustomFunction.createExternal(
  'currentPath',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const path = getHomePath(
      mockEnvironment.get().getLocal().user,
      mockEnvironment.get().getLocal().computer
    );

    return Promise.resolve(new CustomString(path ? '/' + path.join('/') : '/'));
  }
);

export const parentPath = CustomFunction.createExternal(
  'parentPath',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const path = args.get('path');

    if (path instanceof CustomNil || path.toString() === '') {
      throw new Error('parent_path: Invalid arguments');
    }

    const result = path.toString().replace(/\/[^/]+\/?$/i, '');

    return Promise.resolve(new CustomString(result));
  }
).addArgument('path');

export const homeDir = CustomFunction.createExternal(
  'homeDir',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const path = getHomePath(
      mockEnvironment.get().getLocal().user,
      mockEnvironment.get().getLocal().computer
    );

    return Promise.resolve(new CustomString(path ? '/' + path.join('/') : '/'));
  }
);

export const programPath = CustomFunction.createExternal(
  'programPath',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const path = getHomePath(
      mockEnvironment.get().getLocal().user,
      mockEnvironment.get().getLocal().computer
    );

    return Promise.resolve(
      new CustomString(
        path ? '/' + path.join('/') + '/myprogramm' : '/myprogramm'
      )
    );
  }
);

export const activeUser = CustomFunction.createExternal(
  'activeUser',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(
      new CustomString(mockEnvironment.get().getLocal().user.username)
    );
  }
);

export const userMailAddress = CustomFunction.createExternal(
  'userMailAddress',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(
      new CustomString(mockEnvironment.get().getLocal().user.email)
    );
  }
);

export const userBankNumber = CustomFunction.createExternal(
  'userMailAddress',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(
      new CustomString(mockEnvironment.get().getLocal().user.userBankNumber)
    );
  }
);

export const formatColumns = CustomFunction.createExternal(
  'formatColumns',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const columns = args.get('columns');

    if (columns instanceof CustomNil) {
      return Promise.resolve(new CustomString(''));
    }

    const list = columns.toString().replace(/\\n/g, '\n').split('\n');
    const v: Array<Array<string>> = [];
    const l: Array<number> = [];

    for (let i = 0; i < list.length; i++) {
      const rows = list[i].split(/\s+/);
      v.push([]);

      for (let j = 0; j < rows.length; j++) {
        if (rows.length > l.length) {
          l.push(j);
        }
        const txt = rows[j];

        if (txt.length > l[j]) {
          l[j] = txt.length;
        }

        v[i].push(txt);
      }
    }

    const seperation = 2;
    const lines = [];

    for (let i = 0; i < v.length; i++) {
      let output = '';
      for (let j = 0; j < v[i].length; j++) {
        const txt = v[i][j];
        output += txt;
        const len = l[j] - txt.length + seperation;
        output += ' '.repeat(len);
      }
      lines.push(output);
    }

    return Promise.resolve(new CustomString(lines.join('\n')));
  }
).addArgument('columns');

export const userInput = CustomFunction.createExternal(
  'userInput',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(new CustomString('test-input'));
  }
);

export const clearScreen = CustomFunction.createExternal(
  'clearScreen',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(Defaults.Void);
  }
);

export const launchPath = CustomFunction.createExternal(
  'launchPath',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const path = getHomePath(
      mockEnvironment.get().getLocal().user,
      mockEnvironment.get().getLocal().computer
    );

    return Promise.resolve(new CustomString(path ? '/' + path.join('/') : '/'));
  }
);

export const typeOf = CustomFunction.createExternal(
  'typeOf',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const type = args.get('value')?.getCustomType() || 'undefined';

    return Promise.resolve(new CustomString(type));
  }
).addArgument('value');
