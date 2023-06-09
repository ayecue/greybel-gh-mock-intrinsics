import actualMd5 from 'blueimp-md5';
import {
  CustomBoolean,
  CustomFunction,
  CustomNil,
  CustomNumber,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { Type, Utils } from 'greybel-mock-environment';

import { create as createAptClient } from './apt-client';
import { create as createBlockchain } from './blockchain';
import { create as createCrypto } from './crypto';
import { create as createMetaMail } from './meta-mail';
import { create as createMetaxploit } from './metaxploit';
import { GHMockIntrinsicEnv } from './mock/environment';
import { create as createRouter } from './router';
import { create as createService } from './service';
import { loginLocal } from './shell';
import { create as createTestLib } from './test-lib';
import {
  formatColumns as formatColumnsInternal,
  keyEventToString,
  Month
} from './utils';

export interface GenericIntrinsics {
  getShell: CustomFunction;
  mailLogin: CustomFunction;
  getRouter: CustomFunction;
  getSwitch: CustomFunction;
  includeLib: CustomFunction;
  md5: CustomFunction;
  time: CustomFunction;
  nslookup: CustomFunction;
  whois: CustomFunction;
  isValidIp: CustomFunction;
  isLanIp: CustomFunction;
  commandInfo: CustomFunction;
  currentDate: CustomFunction;
  currentPath: CustomFunction;
  parentPath: CustomFunction;
  homeDir: CustomFunction;
  programPath: CustomFunction;
  activeUser: CustomFunction;
  userMailAddress: CustomFunction;
  userBankNumber: CustomFunction;
  formatColumns: CustomFunction;
  userInput: CustomFunction;
  clearScreen: CustomFunction;
  launchPath: CustomFunction;
  typeOf: CustomFunction;
  getCustomObject: CustomFunction;
}

export default function generics(
  mockEnvironment: GHMockIntrinsicEnv
): GenericIntrinsics {
  const intrinsics: GenericIntrinsics = {
    getShell: CustomFunction.createExternal(
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

        return Promise.resolve(loginLocal(user, password, mockEnvironment));
      }
    )
      .addArgument('user', new CustomString(''))
      .addArgument('password', new CustomString('')),

    mailLogin: CustomFunction.createExternal(
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
          return Promise.resolve(DefaultType.Void);
        }

        return Promise.resolve(createMetaMail(mockEnvironment, email));
      }
    )
      .addArgument('user')
      .addArgument('password'),

    getRouter: CustomFunction.createExternal(
      'getRouter',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ipAddress = args.get('ipAddress');

        if (!(ipAddress instanceof CustomString)) {
          return Promise.resolve(DefaultType.Void);
        }

        const target = ipAddress.toString();

        if (!Utils.isValidIp(target) && target !== '') {
          return Promise.resolve(DefaultType.Void);
        }

        const { user, device } = mockEnvironment.getLocal();
        let router = device.getRouter() as Type.Router;

        if (target !== '') {
          router = mockEnvironment.getRouterByIp(target);
        }

        return Promise.resolve(createRouter(mockEnvironment, user, router));
      }
    ).addArgument('ipAddress', new CustomString('')),

    getSwitch: CustomFunction.createExternal(
      'getSwitch',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ipAddress = args.get('ipAddress');

        if (!(ipAddress instanceof CustomString)) {
          return Promise.resolve(DefaultType.Void);
        }

        const target = ipAddress.toString();

        if (!Utils.isValidIp(target)) {
          return Promise.resolve(DefaultType.Void);
        }

        if (!Utils.isLanIp(target)) {
          return Promise.resolve(DefaultType.Void);
        }

        const { user } = mockEnvironment.getLocal();
        const router = mockEnvironment.getSwitchByIp(target);

        if (router) {
          return Promise.resolve(createRouter(mockEnvironment, user, router));
        }

        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('ipAddress'),

    includeLib: CustomFunction.createExternal(
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

        const { user, device } = mockEnvironment.getLocal();
        const target = Utils.getTraversalPath(libPath.toString(), null);
        const entityResult = device.getFile(target);

        if (entityResult && entityResult instanceof Type.File) {
          const { r } = entityResult.getPermissionsForUser(user, device.groups);

          if (r) {
            switch ((entityResult as Type.File).type) {
              case Type.FileType.SSH:
              case Type.FileType.FTP:
              case Type.FileType.HTTP:
              case Type.FileType.Chat:
              case Type.FileType.RShell:
              case Type.FileType.Repository:
                return Promise.resolve(
                  createService(mockEnvironment, entityResult, user, device)
                );
              case Type.FileType.AptClient:
                return Promise.resolve(
                  createAptClient(mockEnvironment, entityResult, user, device)
                );
              case Type.FileType.Crypto:
                return Promise.resolve(
                  createCrypto(mockEnvironment, entityResult, user, device)
                );
              case Type.FileType.Metaxploit:
                return Promise.resolve(
                  createMetaxploit(mockEnvironment, entityResult, user, device)
                );
              case Type.FileType.Blockchain:
                return Promise.resolve(
                  createBlockchain(mockEnvironment, entityResult, user, device)
                );
              case Type.FileType.TestLib:
                return Promise.resolve(createTestLib(mockEnvironment));
              default:
            }
          }
        }

        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('libPath'),

    md5: CustomFunction.createExternal(
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
        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('value'),

    time: CustomFunction.createExternal(
      'time',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(
          new CustomNumber(mockEnvironment.getElapsedTime())
        );
      }
    ),

    nslookup: CustomFunction.createExternal(
      'nslookup',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const target = args.get('hostname').toString();
        const router = mockEnvironment.findRouterViaNS(target);

        if (router instanceof Type.Router) {
          return Promise.resolve(new CustomString(router.publicIp));
        }

        return Promise.resolve(new CustomString('Not found'));
      }
    ).addArgument('hostname'),

    whois: CustomFunction.createExternal(
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
          return Promise.resolve(
            new CustomString(`Invalid IP adress ${target}`)
          );
        }

        if (Utils.isLanIp(target)) {
          return Promise.resolve(
            new CustomString('Error: the IP address must be public')
          );
        }

        const router = mockEnvironment.getRouterByIp(target);

        if (router) {
          return Promise.resolve(new CustomString(router.whoisDescription));
        }

        return Promise.resolve(new CustomString('Address not found'));
      }
    ).addArgument('ipAddress'),

    isValidIp: CustomFunction.createExternal(
      'isValidIp',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const target = args.get('ipAddress').toString();
        return Promise.resolve(new CustomBoolean(Utils.isValidIp(target)));
      }
    ).addArgument('ipAddress'),

    isLanIp: CustomFunction.createExternal(
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
    ).addArgument('ipAddress'),

    commandInfo: CustomFunction.createExternal(
      'commandInfo',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const key = args.get('idCommand').toString().toUpperCase();
        const text = Utils.getTranslationText(key);

        if (text === null) {
          return Promise.resolve(new CustomString('Unknown info'));
        }

        return Promise.resolve(
          new CustomString(text)
        );
      }
    ).addArgument('idCommand'),

    currentDate: CustomFunction.createExternal(
      'currentDate',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const date = new Date(Date.now());
        const result = `${date.getDate()}/${
          Month[date.getMonth() + 1]
        }/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;
        return Promise.resolve(new CustomString(result));
      }
    ),

    currentPath: CustomFunction.createExternal(
      'currentPath',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLatestSession();
        const path = session.currentPath.getPath();

        return Promise.resolve(new CustomString(path));
      }
    ),

    parentPath: CustomFunction.createExternal(
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

        const result = path.toString().replace(/\/?[^/]+\/?$/i, '');

        if (result.length === 0) {
          return Promise.resolve(new CustomString('/'));
        }

        return Promise.resolve(new CustomString(result));
      }
    ).addArgument('path'),

    homeDir: CustomFunction.createExternal(
      'homeDir',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const { device, user } = mockEnvironment.getLatestSession();
        const path = device.getHomePath(user);

        return Promise.resolve(
          new CustomString(path ? '/' + path.join('/') : '/')
        );
      }
    ),

    programPath: CustomFunction.createExternal(
      'programPath',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLocal();
        const path = session.programPath.getPath();

        return Promise.resolve(new CustomString(path));
      }
    ),

    activeUser: CustomFunction.createExternal(
      'activeUser',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLatestSession();

        return Promise.resolve(new CustomString(session.user.username));
      }
    ),

    userMailAddress: CustomFunction.createExternal(
      'userMailAddress',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLocal();

        return Promise.resolve(new CustomString(session.user.email.email));
      }
    ),

    userBankNumber: CustomFunction.createExternal(
      'userBankNumber',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLocal();

        return Promise.resolve(new CustomString(session.user.bankAccount.id));
      }
    ),

    formatColumns: CustomFunction.createExternal(
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
    ).addArgument('columns'),

    userInput: CustomFunction.createExternal(
      'userInput',
      async (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const message = args.get('message').toString();
        const isPassword = args.get('isPassword').toTruthy();
        const anyKey = args.get('anyKey').toTruthy();

        if (anyKey) {
          const keyPress = await ctx.handler.outputHandler.waitForKeyPress(
            ctx,
            message
          );
          const value = keyEventToString(keyPress);

          return new CustomString(value);
        }

        const input = await ctx.handler.outputHandler.waitForInput(
          ctx,
          isPassword,
          message
        );

        return new CustomString(input);
      }
    )
      .addArgument('message')
      .addArgument('isPassword')
      .addArgument('anyKey'),

    clearScreen: CustomFunction.createExternal(
      'clearScreen',
      (
        ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        ctx.handler.outputHandler.clear(ctx);
        return Promise.resolve(DefaultType.Void);
      }
    ),

    launchPath: CustomFunction.createExternal(
      'launchPath',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const session = mockEnvironment.getLatestSession();
        const path = session.programPath.getPath();

        return Promise.resolve(new CustomString(path));
      }
    ),

    typeOf: CustomFunction.createExternal(
      'typeOf',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const type =
          args.get('value')?.getCustomType() || DefaultType.Void.toString();

        return Promise.resolve(new CustomString(type));
      }
    ).addArgument('value'),

    getCustomObject: CustomFunction.createExternal(
      'getCustomObject',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(mockEnvironment.getSharedCustomObject());
      }
    )
  };

  return intrinsics;
}
