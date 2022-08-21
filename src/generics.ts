import actualMd5 from 'blueimp-md5';
import {
  CustomBoolean,
  CustomFunction,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import { create as createAptClient } from './apt-client';
import { create as createCrypto } from './crypto';
import { create as createMetaMail } from './meta-mail';
import { create as createMetaxploit } from './metaxploit';
import { create as createBlockchain } from './blockchain';
import { create as createService } from './service';
import mockEnvironment from './mock/environment';
import { create as createRouter } from './router';
import { loginLocal } from './shell';
import { File, FileType } from './types';
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
    return Promise.resolve(loginLocal(user, password));
  }
)
  .addArgument('user')
  .addArgument('password');

export const mailLogin = CustomFunction.createExternal(
  'mailLogin',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const user = args.get('user');
    const password = args.get('password');
    const email = mockEnvironment.getEmailViaLogin(
      user.toString(),
      password.toString()
    );

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
    const { user, computer } = mockEnvironment.getLocal();
    const target = args.get('ipAddress').toString();
    const router = mockEnvironment.getRouterByIp(
      target || computer.router?.publicIp
    );

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
    const { user, computer } = mockEnvironment.getLocal();
    const target = args.get('ipAddress').toString();
    const router = mockEnvironment.getRouterByIp(
      target || computer.router?.publicIp
    );

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
    const libPath = args.get('libPath').toString();
    const { user, computer } = mockEnvironment.getLocal();
    const target = getTraversalPath(libPath, null);
    const entityResult = getFile(computer.fileSystem, target);

    if (entityResult && !entityResult.isFolder) {
      const { r } = getPermissions(user, entityResult);

      if (r) {
        switch ((entityResult as File).type) {
          case FileType.SSH:
          case FileType.FTP:
          case FileType.HTTP:
          case FileType.Chat:
          case FileType.RShell:
          case FileType.Repository:
            return Promise.resolve(createService(user, computer));
          case FileType.AptClient:
            return Promise.resolve(createAptClient(user, computer));
          case FileType.Crypto:
            return Promise.resolve(createCrypto(user, computer));
          case FileType.Metaxploit:
            return Promise.resolve(createMetaxploit(user, computer));
          case FileType.Blockchain:
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
    const router = mockEnvironment.findRouterViaNS(target);
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
    const target = args.get('ipAddress').toString();
    if (mockEnvironment.isValidIp(target)) {
      return Promise.resolve(
        new CustomString(mockEnvironment.getRouterByIp(target).whoisDescription)
      );
    }
    return Promise.resolve(new CustomString(`Invalid IP address: ${target}`));
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
      new CustomBoolean(mockEnvironment.isValidIp(target))
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
    return Promise.resolve(new CustomBoolean(mockEnvironment.isLanIp(target)));
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
      mockEnvironment.getLocal().user,
      mockEnvironment.getLocal().computer
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
    const path = args.get('path').toString();
    return Promise.resolve(new CustomString(path.replace(/\/[^/]+\/?$/i, '')));
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
      mockEnvironment.getLocal().user,
      mockEnvironment.getLocal().computer
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
      mockEnvironment.getLocal().user,
      mockEnvironment.getLocal().computer
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
      new CustomString(mockEnvironment.getLocal().user.username)
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
      new CustomString(mockEnvironment.getLocal().user.email)
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
      new CustomString(mockEnvironment.getLocal().user.userBankNumber)
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
    return Promise.resolve(new CustomString(args.get('columns').toString()));
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
      mockEnvironment.getLocal().user,
      mockEnvironment.getLocal().computer
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
    return Promise.resolve(new CustomString(args.get('value').getCustomType()));
  }
).addArgument('value');
