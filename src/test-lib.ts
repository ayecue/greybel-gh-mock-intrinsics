import {
  CustomFunction,
  CustomList,
  CustomMap,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  Operation,
  OperationContext
} from 'greybel-interpreter';

import { Computer, create as createComputer } from './computer';
import { create as createFile, File } from './file';
import GreyMap from './grey-map';
import BasicInterface from './interface';
import { GHMockIntrinsicEnv } from './mock/environment';
import { create as createRouter, Router } from './router';
import { create as createShell } from './shell';

export interface TestVariables {
  mockEnvironment: GHMockIntrinsicEnv;
}

export class TestLib extends BasicInterface {
  static readonly type: string = 'TestLib';
  static readonly isa: GreyMap = new GreyMap([
    CustomFunction.createExternalWithSelf(
      'sessions',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = TestLib.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
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
          return Promise.resolve(DefaultType.Void);
        }

        const { mockEnvironment } = self.variables;
        const ip = args.get('ip');

        if (ip instanceof CustomNil) {
          return Promise.resolve(DefaultType.Void);
        }

        const router = mockEnvironment.getRouterByIp(ip.toString());

        if (router === null) {
          return Promise.resolve(DefaultType.Void);
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
          return Promise.resolve(DefaultType.Void);
        }

        const { mockEnvironment } = self.variables;
        const routerArg = args.get('router');

        if (!(routerArg instanceof Router)) {
          return Promise.resolve(DefaultType.Void);
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
          return Promise.resolve(DefaultType.Void);
        }

        const { mockEnvironment } = self.variables;
        const computerArg = args.get('computer');

        if (!(computerArg instanceof Computer)) {
          return Promise.resolve(DefaultType.Void);
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
          return Promise.resolve(DefaultType.Void);
        }

        const { mockEnvironment } = self.variables;
        const fileArg = args.get('file');

        if (!(fileArg instanceof File)) {
          return Promise.resolve(DefaultType.Void);
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
          return Promise.resolve(DefaultType.Void);
        }

        const { mockEnvironment } = self.variables;
        const fileArg = args.get('file');

        if (!(fileArg instanceof File)) {
          return Promise.resolve(DefaultType.Void);
        }

        const { device } = fileArg.variables;
        const rootUser = device.users.get('root');
        const shell = createComputer(mockEnvironment, rootUser, device, {
          location: ['root']
        });

        return Promise.resolve(shell);
      }
    ).addArgument('file'),
    CustomFunction.createExternalWithSelf(
      'try_to_execute',
      async (
        ctx: OperationContext,
        self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const callback = args.get('callback');
        const onError = args.get('onError');
        const callbackArgs = args.get('args');

        if (!(callback instanceof CustomFunction)) {
          return Promise.resolve(
            new CustomString('callback argument has to be provided.')
          );
        }

        if (!(onError instanceof CustomFunction)) {
          return Promise.resolve(
            new CustomString('onError argument has to be provided.')
          );
        }

        if (!(callbackArgs instanceof CustomList)) {
          return Promise.resolve(
            new CustomString('args argument has to be a list.')
          );
        }

        try {
          const result = await callback.run(self, callbackArgs.value, ctx);
          return result;
        } catch (err) {
          const lastActive = ctx.getLastActive();

          await onError.run(
            self,
            [
              new CustomString(err.message),
              new CustomString(
                lastActive.stackTrace
                  .map((op: Operation) => {
                    return `at ${op.target}:${op.item?.start.line ?? 0}:${
                      op.item?.start.character ?? 0
                    }`;
                  })
                  .join('\n')
              )
            ],
            ctx
          );
        }

        return DefaultType.Void;
      }
    )
      .addArgument('callback')
      .addArgument('onError')
      .addArgument('args', new CustomList()),
    CustomFunction.createExternalWithSelf(
      'try_to_execute_with_debug',
      async (
        ctx: OperationContext,
        self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const callback = args.get('callback');
        const callbackArgs = args.get('args');

        if (!(callback instanceof CustomFunction)) {
          return Promise.resolve(
            new CustomString('callback argument has to be provided.')
          );
        }

        if (!(callbackArgs instanceof CustomList)) {
          return Promise.resolve(
            new CustomString('args argument has to be a list.')
          );
        }

        try {
          const result = await callback.run(self, callbackArgs.value, ctx);
          return result;
        } catch (err) {
          const lastActive = ctx.getLastActive();
          const op = lastActive.stackTrace[0];

          ctx.debugger.setBreakpoint(true);
          ctx.debugger.interact(lastActive, op.item, op);
          await ctx.debugger.resume();
        }

        return DefaultType.Void;
      }
    )
      .addArgument('callback')
      .addArgument('args', new CustomList())
  ]);

  static retreive(args: Map<string, CustomValue>): TestLib | null {
    const intf = args.get('self');
    if (intf instanceof TestLib) {
      return intf;
    }
    return null;
  }

  variables: TestVariables;

  constructor(variables: TestVariables) {
    super(TestLib.type, TestLib.isa);
    this.variables = variables;
  }
}

export function create(mockEnvironment: GHMockIntrinsicEnv): BasicInterface {
  const itrface = new TestLib({
    mockEnvironment
  });

  return itrface;
}
