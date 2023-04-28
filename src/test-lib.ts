import {
  CustomFunction,
  CustomList,
  CustomMap,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment } from 'greybel-mock-environment';

import { Computer, create as createComputer } from './computer';
import { create as createFile, File } from './file';
import BasicInterface from './interface';
import { create as createRouter, Router } from './router';
import { create as createShell } from './shell';

export interface TestVariables {
  mockEnvironment: MockEnvironment;
}

export class TestLib extends BasicInterface {
  static readonly type: string = 'testLib';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'sessions',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const result = [];

        for (const session of mockEnvironment.sessions) {
          const newSession = new CustomMap();

          newSession.set(
            new CustomString('device'),
            createComputer(mockEnvironment, session.user, session.device)
          );
          newSession.set(
            new CustomString('program'),
            createFile(
              mockEnvironment,
              session.user,
              session.device,
              session.programPath
            )
          );
          newSession.set(
            new CustomString('currentPath'),
            createFile(
              mockEnvironment,
              session.user,
              session.device,
              session.currentPath
            )
          );

          result.push(newSession);
        }

        return Promise.resolve(new CustomList(result));
      }
    ),
    CustomFunction.createExternalWithSelf(
      'get_or_create_router',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const ip = args.get('ip');

        if (ip instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const router = mockEnvironment.getRouterByIp(ip.toString());

        if (router === null) {
          return Promise.resolve(Defaults.Void);
        }

        const newRouter = createRouter(
          mockEnvironment,
          router.users.get('root'),
          router
        );

        return Promise.resolve(newRouter);
      }
    ).addArgument('ip'),
    CustomFunction.createExternalWithSelf(
      'get_computers_connected_to_router',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const routerArg = args.get('router');

        if (!(routerArg instanceof Router)) {
          return Promise.resolve(Defaults.Void);
        }

        const { router } = routerArg.variables;
        const result = new CustomMap();

        for (const [ip, device] of router.devices) {
          const rootUser = device.users.get('root');

          result.set(
            new CustomString(ip),
            createComputer(mockEnvironment, rootUser, device)
          );
        }

        return Promise.resolve(result);
      }
    ).addArgument('router'),
    CustomFunction.createExternalWithSelf(
      'get_shell_for_computer',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const computerArg = args.get('computer');

        if (!(computerArg instanceof Computer)) {
          return Promise.resolve(Defaults.Void);
        }

        const { device } = computerArg.variables;
        const rootUser = device.users.get('root');
        const shell = createShell(mockEnvironment, rootUser, device, {
          location: ['root']
        });

        return Promise.resolve(shell);
      }
    ).addArgument('computer'),
    CustomFunction.createExternalWithSelf(
      'get_shell_for_file',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const fileArg = args.get('file');

        if (!(fileArg instanceof File)) {
          return Promise.resolve(Defaults.Void);
        }

        const { device } = fileArg.variables;
        const rootUser = device.users.get('root');
        const shell = createShell(mockEnvironment, rootUser, device, {
          location: ['root']
        });

        return Promise.resolve(shell);
      }
    ).addArgument('file'),
    CustomFunction.createExternalWithSelf(
      'get_computer_for_file',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(Defaults.Void);
        }

        const { mockEnvironment } = self.variables;
        const fileArg = args.get('file');

        if (!(fileArg instanceof File)) {
          return Promise.resolve(Defaults.Void);
        }

        const { device } = fileArg.variables;
        const rootUser = device.users.get('root');
        const shell = createComputer(mockEnvironment, rootUser, device, {
          location: ['root']
        });

        return Promise.resolve(shell);
      }
    ).addArgument('file')
  ];

  static retreive(args: Map<string, CustomValue>): TestLib | null {
    const intf = args.get('self');
    if (intf instanceof TestLib) {
      return intf;
    }
    return null;
  }

  variables: TestVariables;

  constructor(variables: TestVariables) {
    super(TestLib.type);
    this.variables = variables;
    TestLib.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(mockEnvironment: MockEnvironment): BasicInterface {
  const itrface = new TestLib({
    mockEnvironment
  });

  return itrface;
}
