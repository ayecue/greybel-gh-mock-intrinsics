import {
  CustomFunction,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  VM,
  OperationContext
} from 'greybel-interpreter';
import {
  Interpreter
} from 'greyscript-interpreter';
import {
  Stack
} from 'greybel-interpreter/dist/utils/stack';
import { MockTranspiler, Type, Utils } from 'greybel-mock-environment';

import { create as createComputer } from './computer';
import GreyMap from './grey-map';
import BasicInterface from './interface';
import { GHMockIntrinsicEnv } from './mock/environment';
import { isNullOrEmpty } from './utils';

export const startTerminal = CustomFunction.createExternalWithSelf(
  'start_terminal',
  (
    _vm: VM,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(DefaultType.Void);
  }
);

export const hostComputer = CustomFunction.createExternalWithSelf(
  'host_computer',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, device, options } = self.variables;
    const currentLocation = options.location;
    return Promise.resolve(
      createComputer(mockEnvironment, user, device, {
        location: currentLocation
      })
    );
  }
);

export const connectService = CustomFunction.createExternalWithSelf(
  'connect_service',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, device } = self.variables;
    const ip = args.get('ip');
    const port = args.get('port');
    const user = args.get('user');
    const password = args.get('password');

    if (
      ip instanceof CustomNil ||
      port instanceof CustomNil ||
      user instanceof CustomNil ||
      password instanceof CustomNil
    ) {
      throw new Error('connect_service: Invalid arguments');
    }

    const service = args.get('service').toString();
    const ipAddress = ip.toString();

    if (service !== 'ssh' && service !== 'ftp') {
      throw new Error('Invalid service ID');
    }

    let remoteDevice;

    if (Utils.isLanIp(ipAddress)) {
      remoteDevice = device.findByLanIp(ipAddress);
    } else {
      const router = mockEnvironment.getRouterByIp(ipAddress);
      remoteDevice = router.getForwarded(port.toInt());
    }

    if (remoteDevice === null) {
      return Promise.resolve(new CustomString('ip address not found'));
    }

    const remotePort = remoteDevice.findPort(port.toInt());

    if (
      remotePort === null ||
      remotePort.service !== Type.ServiceType.SSH
    ) {
      return Promise.resolve(
        new CustomString(`can't connect: port ${port.toInt()} not found`)
      );
    }

    if (remotePort.isClosed) {
      return Promise.resolve(
        new CustomString("can't connect: port closed")
      );
    }

    const cUser = user.toString();
    const cPass = password.toString();
    const remoteUser = remoteDevice.users.get(cUser);

    if (!remoteUser || remoteUser.password.value !== cPass) {
      return Promise.resolve(new CustomString('invalid credentials'));
    }

    return Promise.resolve(
      create(mockEnvironment, remoteUser, remoteDevice, {
        port: remotePort
      })
    );
  }
)
  .addArgument('ip')
  .addArgument('port')
  .addArgument('user')
  .addArgument('password')
  .addArgument('service', new CustomString('ssh'));

export const scp = CustomFunction.createExternalWithSelf(
  'scp',
  async (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return DefaultType.Void;
    }

    const { options, device, user } = self.variables;
    const currentLocation = options.location;
    const pathOrig = args.get('pathOrig');
    const pathDest = args.get('pathDest');
    const remoteShell = args.get('remoteShell');

    if (
      pathOrig instanceof CustomNil ||
      pathDest instanceof CustomNil ||
      remoteShell instanceof CustomNil
    ) {
      return DefaultType.Void;
    }

    const remoteType = remoteShell.getCustomType();

    if (remoteType === Shell.type || remoteType === FtpShell.type) {
      const rshell = remoteShell as BasicInterface;
      const traversalPath = Utils.getTraversalPath(
        pathOrig.toString(),
        currentLocation
      );
      const localFile = device.getFile(traversalPath);
      const remoteOptions = rshell.getVariable<ShellOptions>('options');
      const remoteTraversalPath = Utils.getTraversalPath(
        pathDest.toString(),
        remoteOptions.location
      );
      const remoteFolder = rshell
        .getVariable<Type.Device>('device')
        .getFile(remoteTraversalPath);

      if (localFile === null) {
        return new CustomString(`${pathOrig.toString()} not found`);
      }

      if (remoteFolder === null) {
        return new CustomString(`${pathDest.toString()} not found`);
      }

      if (!(remoteFolder instanceof Type.Folder)) {
        return new CustomString(`${pathDest.toString()} it's not a folder`);
      }

      const { r } = localFile.getPermissionsForUser(user, device.groups);

      if (!r) {
        return new CustomString('Permission denied');
      }

      const { w } = remoteFolder.getPermissionsForUser(
        rshell.getVariable<Type.User>('user'),
        rshell.getVariable<Type.Device>('device').groups,
      );

      if (!w) {
        return new CustomString('Permission denied');
      }

      await vm.handler.outputHandler.progress(vm, 2000);

      remoteFolder.putEntity(localFile as Type.File);
      return DefaultType.True;
    }

    return DefaultType.Void;
  }
)
  .addArgument('pathOrig')
  .addArgument('pathDest')
  .addArgument('remoteShell');

export const build = CustomFunction.createExternalWithSelf(
  'build',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { user, device } = self.variables;
    const pathSource = args.get('pathSource');
    const pathBinary = args.get('pathBinary');
    const allowImport = args.get('allowImport');

    if (
      pathSource instanceof CustomNil ||
      pathBinary instanceof CustomNil ||
      allowImport instanceof CustomNil
    ) {
      throw new Error('build: Invalid arguments');
    }

    const pathSourceRaw = pathSource.toString();
    const pathBinaryRaw = pathBinary.toString();

    if (pathSourceRaw === '' || pathBinaryRaw === '') {
      return Promise.resolve(
        new CustomString("pathSource and programName can't be empty")
      );
    }

    const source = device.getFile(Utils.getTraversalPath(pathSourceRaw));

    if (source === null) {
      return Promise.resolve(
        new CustomString(`Can't find ${pathSourceRaw}`)
      );
    }

    if (!(source instanceof Type.File)) {
      return Promise.resolve(new CustomString('Source has to be a file'));
    }

    const dest = device.getFile(Utils.getTraversalPath(pathBinaryRaw));

    if (dest === null) {
      return Promise.resolve(
        new CustomString(`Can't find ${pathBinaryRaw}`)
      );
    }

    if (!(dest instanceof Type.Folder)) {
      return Promise.resolve(
        new CustomString('Destination has to be a folder')
      );
    }

    const sourcePerms = source.getPermissionsForUser(user, device.groups);

    if (!sourcePerms.r) {
      return Promise.resolve(
        new CustomString(
          `Can't access to ${pathSourceRaw}. Permission denied.`
        )
      );
    }

    if (source.type !== Type.FileType.Source) {
      return Promise.resolve(
        new CustomString(`Can't build ${source.name}. Binary file`)
      );
    }

    const destPerms = dest.getPermissionsForUser(user, device.groups);

    if (!destPerms.w) {
      return Promise.resolve(
        new CustomString(
          `Can't create binary in ${pathBinaryRaw}. Permission denied.`
        )
      );
    }

    const segments = source.name.split('.');

    if (segments.length == 1 || (segments.length == 2 && isNullOrEmpty(segments[0]))) {
      return Promise.resolve(
        new CustomString(`Can't build ${source.name}. Invalid extension.`)
      );
    }

    if (source.content === '') {
      return Promise.resolve(
        new CustomString("Can't compile. Source code is empty")
      );
    }

    try {
      const transpiler = new MockTranspiler({
        code: source.content,
        user,
        computer: device
      });
      const output = transpiler.parse();
      const outputBin = new Type.File(
        {
          type: Type.FileType.Binary,
          name: source.name.replace(/\.[^.]*$/, ''),
          content: output,
          permissions: 'rwxrwxrwx',
          owner: user.username,
          allowImport: allowImport.toTruthy()
        },
        dest
      );

      dest.putEntity(outputBin);
    } catch (err: any) {
      return Promise.resolve(new CustomString(err.message));
    }

    return Promise.resolve(new CustomString(''));
  }
)
  .addArgument('pathSource')
  .addArgument('pathBinary')
  .addArgument('allowImport', DefaultType.False);

export const launch = CustomFunction.createExternalWithSelf(
  'launch',
  async (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, device, user, options } = self.variables;
    const currentLocation = options.location;
    const path = args.get('path');
    const params = args.get('params');

    if (path instanceof CustomNil || params instanceof CustomNil) {
      throw new Error('launch: Invalid arguments');
    }

    const file = device.getFile(
      Utils.getTraversalPath(path.toString(), currentLocation)
    );

    if (file === null) {
      vm.handler.outputHandler.print(
        vm,
        `Error: ${path.toString()} not found.`
      );
      return DefaultType.False;
    }

    if (
      !(file instanceof Type.File) ||
      file.type !== Type.FileType.Binary
    ) {
      vm.handler.outputHandler.print(
        vm,
        `${file.name} is not an executable file.`
      );
      return DefaultType.False;
    }

    const perms = file.getPermissionsForUser(user, device.groups);

    if (!perms.x) {
      vm.handler.outputHandler.print(
        vm,
        "Can't launch program. Permission denied."
      );
      return DefaultType.False;
    }

    const paramsStr = params.toString();
    const matches = paramsStr.match(/(\/\/|\\\\|[[\];\\{}()])/);

    if (matches) {
      vm.handler.outputHandler.print(
        vm,
        `Error: invalid character ${matches[1]} in program parameters.`
      );
      return DefaultType.False;
    }

    if (mockEnvironment.getLaunchCallStack() > 16) {
      vm.handler.outputHandler.print(
        vm,
        'Program interrupted. Too many stack calls.'
      );
      return DefaultType.False;
    }

    mockEnvironment.increaseLaunchCallStack();

    const interpreter = new Interpreter({
      target: file.isExternalProgram ? vm.target : 'virtual_script',
      handler: vm.handler,
      params: paramsStr ? paramsStr.split(' ') : undefined,
      api: vm.getFrame().api.scope.value,
      debugger: vm.debugger
    });
    const session = new Type.Session({
      user,
      device,
      currentPath: device.getFile(currentLocation) as Type.Folder,
      programPath: file
    });

    mockEnvironment.sessions.push(session);

    const externalFrames: Stack<OperationContext> = new Stack();

    vm.externalFrames.values().forEach((ctx) => externalFrames.push(ctx));
    vm.getFrames().values().forEach((ctx) => externalFrames.push(ctx));

    await interpreter.run({
      customCode: file.content,
      vmOptions: {
        externalFrames,
        contextTypeIntrinsics: vm.contextTypeIntrinsics
      }
    });

    mockEnvironment.sessions.pop();
    mockEnvironment.decreaseLaunchCallStack();

    return DefaultType.True;
  }
)
  .addArgument('path')
  .addArgument('params', new CustomString(''));

export const ping = CustomFunction.createExternalWithSelf(
  'ping',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Shell.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, device } = self.variables;
    const ip = args.get('ipAddress');

    if (ip instanceof CustomNil) {
      throw new Error('ping: Invalid arguments');
    }

    const ipRaw = ip.toString();

    if (!Utils.isValidIp(ipRaw)) {
      return Promise.resolve(new CustomString('ping: invalid ip address'));
    }

    if (Utils.isLanIp(ipRaw)) {
      const lanDevice = device.findByLanIp(ipRaw);

      if (lanDevice === null) {
        return Promise.resolve(DefaultType.False);
      }

      return Promise.resolve(DefaultType.True);
    }

    const router = mockEnvironment.getRouterByIp(ipRaw);

    if (router === null) {
      return Promise.resolve(DefaultType.False);
    }

    return Promise.resolve(DefaultType.True);
  }
).addArgument('ipAddress');

export interface ShellOptions {
  port?: Type.Port;
  location?: string[];
}

export interface ShellVariables {
  mockEnvironment: GHMockIntrinsicEnv;
  user: Type.User;
  device: Type.Device;
  options: ShellOptions;
}

export class BasicShell extends BasicInterface {
  static retreive(args: Map<string, CustomValue>): Shell | null {
    const intf = args.get('self');
    if (intf instanceof Shell) {
      return intf;
    }
    return null;
  }

  variables: ShellVariables;

  constructor(variables: ShellVariables, type: string, isa: GreyMap) {
    super(type, isa);
    this.variables = variables;
  }
}

export class Shell extends BasicShell {
  static readonly type: string = 'shell';
  static readonly isa: GreyMap = new GreyMap([
    startTerminal,
    hostComputer,
    connectService,
    scp,
    build,
    launch,
    ping
  ])

  static retreive(args: Map<string, CustomValue>): Shell | null {
    return BasicShell.retreive(args);
  }

  constructor(variables: ShellVariables) {
    super(variables, Shell.type, Shell.isa);
  }
}

export class FtpShell extends BasicShell {
  static readonly type: string = 'ftpshell';
  static readonly isa: GreyMap = new GreyMap([
    startTerminal,
    hostComputer,
    scp.forkAs('put')
  ]);

  static retreive(args: Map<string, CustomValue>): Shell | null {
    return BasicShell.retreive(args);
  }

  constructor(variables: ShellVariables) {
    super(variables, FtpShell.type, FtpShell.isa);
  }
}

export function createShell(
  mockEnvironment: GHMockIntrinsicEnv,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions
) {
  const itrface = new Shell({
    mockEnvironment,
    user,
    device,
    options
  });

  return itrface;
}

export function createFtpShell(
  mockEnvironment: GHMockIntrinsicEnv,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions
) {
  const itrface = new FtpShell({
    mockEnvironment,
    user,
    device,
    options
  });

  return itrface;
}

export function create(
  mockEnvironment: GHMockIntrinsicEnv,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions = {}
): BasicInterface {
  const currentLocation = options.location || device.getHomePath(user);
  const activePort = options.port ? device.ports.get(options.port.port) : null;
  const itrface =
    activePort?.service === Type.ServiceType.FTP
      ? createFtpShell(mockEnvironment, user, device, {
        ...options,
        location: currentLocation
      })
      : createShell(mockEnvironment, user, device, {
        ...options,
        location: currentLocation
      });

  return itrface;
}

export function loginLocal(
  user: CustomValue,
  password: CustomValue,
  mockEnvironment: GHMockIntrinsicEnv
): CustomValue {
  const session = mockEnvironment.getLatestSession();

  const usr = user.toString();
  const pwd = password.toString();

  if (usr === '' && pwd === '') {
    return create(mockEnvironment, session.user, session.device);
  }

  if (session.device.users.has(usr)) {
    const item = session.device.users.get(usr);

    if (item.password.value === pwd) {
      return create(mockEnvironment, item, session.device);
    }
  }

  return DefaultType.Void;
}
