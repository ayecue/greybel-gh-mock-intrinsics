import {
  CustomFunction,
  CustomInterface,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  Interpreter,
  OperationContext
} from 'greybel-interpreter';
import {
  MockEnvironment,
  MockTranspiler,
  Type,
  Utils
} from 'greybel-mock-environment';

import { create as createComputer } from './computer';
import BasicInterface from './interface';

export interface ShellOptions {
  port?: Type.Port;
  location?: string[];
}

export function createShell(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions
) {
  const currentLocation = options.location;
  const itrface = new BasicInterface('shell');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'connect_service',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
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
          remoteDevice = mockEnvironment.getRouterByIp(ipAddress);
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

        if (!remoteUser || remoteUser.password !== cPass) {
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
      .addArgument('service', new CustomString('ssh'))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'scp',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const pathOrig = args.get('pathOrig');
        const pathDest = args.get('pathDest');
        const remoteShell = args.get('remoteShell');

        if (
          pathOrig instanceof CustomNil ||
          pathDest instanceof CustomNil ||
          remoteShell instanceof CustomNil
        ) {
          return Promise.resolve(Defaults.Void);
        }

        const remoteType = remoteShell.getCustomType();

        if (remoteType === 'shell' || remoteType === 'ftpShell') {
          const rshell = remoteShell as BasicInterface;
          const traversalPath = Utils.getTraversalPath(
            pathOrig.toString(),
            currentLocation
          );
          const localFile = device.getFile(traversalPath);
          const remoteTraversalPath = Utils.getTraversalPath(
            pathDest.toString(),
            rshell.getVariable('currentLocation')
          );
          const remoteFolder = rshell
            .getVariable('device')
            .getFile(remoteTraversalPath);

          if (localFile === null) {
            return Promise.resolve(
              new CustomString(`${pathOrig.toString()} not found`)
            );
          }

          if (remoteFolder === null) {
            return Promise.resolve(
              new CustomString(`${pathDest.toString()} not found`)
            );
          }

          if (remoteFolder instanceof Type.Folder) {
            return Promise.resolve(
              new CustomString(`${pathDest.toString()} it's not a folder`)
            );
          }

          const { r } = localFile.getPermissions(user, device.groups);

          if (!r) {
            return Promise.resolve(new CustomString('Permission denied'));
          }

          const { w } = remoteFolder.getPermissions(
            rshell.getVariable('user'),
            device.groups
          );

          if (!w) {
            return Promise.resolve(new CustomString('Permission denied'));
          }

          ctx.handler.outputHandler.progress(2000);

          remoteFolder.putFile(localFile as Type.File);
          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('pathOrig')
      .addArgument('pathDest')
      .addArgument('remoteShell')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'build',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
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

        const sourcePerms = source.getPermissions(user, device.groups);

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

        const destPerms = dest.getPermissions(user, device.groups);

        if (!destPerms.w) {
          return Promise.resolve(
            new CustomString(
              `Can't create binary in ${pathBinaryRaw}. Permission denied.`
            )
          );
        }

        if (/^\./.test(source.name)) {
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
              permissions: 'drwxrwxrwx',
              owner: user.username
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
      .addArgument('allowImport', Defaults.False)
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'launch',
      async (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path');
        const params = args.get('params');

        if (path instanceof CustomNil || params instanceof CustomNil) {
          throw new Error('launch: Invalid arguments');
        }

        const file = device.getFile(
          Utils.getTraversalPath(path.toString(), currentLocation)
        );

        if (file === null) {
          ctx.handler.outputHandler.print(
            `Error: ${path.toString()} not found.`
          );
          return Defaults.False;
        }

        if (
          !(file instanceof Type.File) ||
          file.type !== Type.FileType.Binary
        ) {
          ctx.handler.outputHandler.print(
            `${file.name} is not an executable file.`
          );
          return Defaults.False;
        }

        const perms = file.getPermissions(user, device.groups);

        if (!perms.x) {
          ctx.handler.outputHandler.print(
            "Can't launch program. Permission denied."
          );
          return Defaults.False;
        }

        const paramsStr = params.toString();
        const matches = paramsStr.match(/(\/\/|\\\\|[[\];\\{}()])/);

        if (matches) {
          ctx.handler.outputHandler.print(
            `Error: invalid character ${matches[1]} in program parameters.`
          );
          return Defaults.False;
        }

        const apiContext = ctx.api;
        const interpreter = new Interpreter({
          handler: ctx.handler,
          debugger: ctx.debugger,
          params: paramsStr ? paramsStr.split(' ') : undefined,
          api: apiContext.scope.value
        });
        const session = new Type.Session({
          user,
          device,
          currentPath: device.getFile(currentLocation) as Type.Folder,
          programPath: file
        });

        mockEnvironment.sessions.push(session);

        await interpreter.run(file.content);

        mockEnvironment.sessions.pop();

        return Defaults.True;
      }
    )
      .addArgument('path')
      .addArgument('params', new CustomString(''))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'ping',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
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
            return Promise.resolve(Defaults.False);
          }
        }

        const router = mockEnvironment.getRouterByIp(ipRaw);

        if (router === null) {
          return Promise.resolve(Defaults.False);
        }

        return Promise.resolve(Defaults.True);
      }
    ).addArgument('ipAddress')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'masterkey',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.Void);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'masterkey_direct',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.Void);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'restore_network',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.Void);
      }
    )
  );

  return itrface;
}

export function createFtpShell(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions
) {
  const currentLocation = options.location;
  const itrface = new BasicInterface('ftpShell');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'put',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const pathOrig = args.get('pathOrig');
        const pathDest = args.get('pathDest');
        const remoteShell = args.get('remoteShell');

        if (
          pathOrig instanceof CustomNil ||
          pathDest instanceof CustomNil ||
          remoteShell instanceof CustomNil
        ) {
          return Promise.resolve(Defaults.Void);
        }

        const remoteType = remoteShell.getCustomType();

        if (remoteType === 'shell' || remoteType === 'ftpShell') {
          const rshell = remoteShell as BasicInterface;
          const traversalPath = Utils.getTraversalPath(
            pathOrig.toString(),
            currentLocation
          );
          const localFile = device.getFile(traversalPath);
          const remoteTraversalPath = Utils.getTraversalPath(
            pathDest.toString(),
            rshell.getVariable('currentLocation')
          );
          const remoteFolder = rshell
            .getVariable('device')
            .getFile(remoteTraversalPath);

          if (localFile === null) {
            return Promise.resolve(
              new CustomString(`${pathOrig.toString()} not found`)
            );
          }

          if (remoteFolder === null) {
            return Promise.resolve(
              new CustomString(`${pathDest.toString()} not found`)
            );
          }

          if (remoteFolder instanceof Type.Folder) {
            return Promise.resolve(
              new CustomString(`${pathDest.toString()} it's not a folder`)
            );
          }

          const { r } = localFile.getPermissions(user, device.groups);

          if (!r) {
            return Promise.resolve(new CustomString('Permission denied'));
          }

          const { w } = remoteFolder.getPermissions(
            rshell.getVariable('user'),
            device.groups
          );

          if (!w) {
            return Promise.resolve(new CustomString('Permission denied'));
          }

          ctx.handler.outputHandler.progress(2000);

          remoteFolder.putFile(localFile as Type.File);
          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('pathOrig')
      .addArgument('pathDest')
      .addArgument('remoteShell')
  );

  return itrface;
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  options: ShellOptions = {}
): CustomInterface {
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

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'start_terminal',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.Void);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'host_computer',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(
          createComputer(mockEnvironment, user, device, {
            location: currentLocation
          })
        );
      }
    )
  );

  itrface.setVariable('user', user);
  itrface.setVariable('device', device);
  itrface.setVariable('currentLocation', currentLocation);

  return itrface;
}

export function loginLocal(
  user: CustomValue,
  password: CustomValue,
  mockEnvironment: MockEnvironment
): CustomValue {
  const session = mockEnvironment.getLatestSession();

  const usr = user.toString();
  const pwd = password.toString();

  if (usr === '' && pwd === '') {
    return create(mockEnvironment, session.user, session.device);
  }

  if (session.device.users.has(usr)) {
    const item = session.device.users.get(usr);

    if (item.password === pwd) {
      return create(mockEnvironment, item, session.device);
    }
  }

  return Defaults.Void;
}
