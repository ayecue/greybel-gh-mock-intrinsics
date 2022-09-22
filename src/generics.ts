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
import { Type, Utils } from 'greybel-mock-environment';

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
  formatColumns as formatColumnsInternal,
  keyEventToString
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
    const ipAddress = args.get('ipAddress');

    if (!(ipAddress instanceof CustomString)) {
      return Promise.resolve(Defaults.Void);
    }

    const target = ipAddress.toString();

    if (!Utils.isValidIp(target) && target !== '') {
      return Promise.resolve(Defaults.Void);
    }

    const { user, computer } = mockEnvironment.get().getLocal();
    let router = computer.router;

    if (target !== '') {
      router = mockEnvironment.get().getRouterByIp(target);
    }

    return Promise.resolve(createRouter(user, router));
  }
).addArgument('ipAddress', new CustomString(''));

export const getSwitch = CustomFunction.createExternal(
  'getSwitch',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const ipAddress = args.get('ipAddress');

    if (!(ipAddress instanceof CustomString)) {
      return Promise.resolve(Defaults.Void);
    }

    const target = ipAddress.toString();

    if (!Utils.isValidIp(target)) {
      return Promise.resolve(Defaults.Void);
    }

    if (!Utils.isLanIp(target)) {
      return Promise.resolve(Defaults.Void);
    }

    const { user } = mockEnvironment.get().getLocal();
    const router = mockEnvironment.get().getSwitchByIp(target);

    if (router) {
      return Promise.resolve(createRouter(user, router));
    }

    return Promise.resolve(Defaults.Void);
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
    const target = Utils.getTraversalPath(libPath.toString(), null);
    const entityResult = computer.getFile(target);

    if (entityResult && !entityResult.isFolder) {
      const { r } = entityResult.getPermissions(user, computer.groups);

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

    if (!Utils.isValidIp(target)) {
      return Promise.resolve(new CustomString(`Invalid IP adress ${target}`));
    }

    if (Utils.isLanIp(target)) {
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
    return Promise.resolve(new CustomBoolean(Utils.isValidIp(target)));
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
      new CustomBoolean(Utils.isValidIp(target) && Utils.isLanIp(target))
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
  '≈',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const session = mockEnvironment.get().getLatestSession();
    const path = session.currentPath.getPath();

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
    const { computer, user } = mockEnvironment.get().getLatestSession();
    const path = computer.getHomePath(user);

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
    const session = mockEnvironment.get().getLocal();
    const path = session.programPath.getPath();

    return Promise.resolve(new CustomString(path ? '/' + path.join('/') : '/'));
  }
);

export const activeUser = CustomFunction.createExternal(
  'activeUser',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const session = mockEnvironment.get().getLatestSession();

    return Promise.resolve(new CustomString(session.user.username));
  }
);

export const userMailAddress = CustomFunction.createExternal(
  'userMailAddress',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const session = mockEnvironment.get().getLocal();

    return Promise.resolve(new CustomString(session.user.email));
  }
);

export const userBankNumber = CustomFunction.createExternal(
  'userMailAddress',
  (
    _ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const session = mockEnvironment.get().getLocal();

    return Promise.resolve(new CustomString(session.user.bankNumber));
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

    const output = formatColumnsInternal(columns.toString());

    return Promise.resolve(new CustomString(output));
  }
).addArgument('columns');

export const userInput = CustomFunction.createExternal(
  'userInput',
  async (
    ctx: OperationContext,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const message = args.get('message').toString();
    const isPassword = args.get('isPassword').toTruthy();
    const anyKey = args.get('anyKey').toTruthy();

    ctx.handler.outputHandler.print(message);

    if (anyKey) {
      const keyPress = await ctx.handler.outputHandler.waitForKeyPress();
      const value = keyEventToString(keyPress);

      return new CustomString(value);
    }

    const input = await ctx.handler.outputHandler.waitForInput(isPassword);

    return new CustomString(input);
  }
)
  .addArgument('message')
  .addArgument('isPassword')
  .addArgument('anyKey');

export const clearScreen = CustomFunction.createExternal(
  'clearScreen',
  (
    ctx: OperationContext,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    ctx.handler.outputHandler.clear();
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
    const session = mockEnvironment.get().getLatestSession();
    const path = session.programPath.getPath();

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
