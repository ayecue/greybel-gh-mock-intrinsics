import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomNumber,
  CustomString,
  CustomValue,
  DefaultType,
  VM
} from 'greybel-interpreter';
import { Type, Utils } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { create as createMetaLib, MetaLib } from './meta-lib';
import { GHMockIntrinsicEnv } from './mock/environment';
import { create as createNetSession } from './net-session';
import { create as createShell } from './shell';
import {
  greaterThanProcNameLimit,
  isValidFileName,
  isValidProcName
} from './utils';

export const load = CustomFunction.createExternalWithSelf(
  'load',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Metaxploit.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, computer, user, metaFile } = self.variables;
    const path = args.get('path');

    if (path instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    const pathRaw = path.toString();

    if (pathRaw === '') {
      throw new Error('load: Invalid arguments');
    }

    const traversalPath = Utils.getTraversalPath(
      pathRaw,
      computer.getHomePath(user)
    );
    const targetFile = computer.getFile(traversalPath);

    if (!targetFile || !(targetFile instanceof Type.File)) {
      return Promise.resolve(DefaultType.Void);
    }

    const library = targetFile.getLibraryType();

    if (!library) {
      return Promise.resolve(DefaultType.Void);
    }

    const libContainer = mockEnvironment.libraryManager.get(library);
    const libVersion = libContainer.get(targetFile.version);
    const vuls = libVersion.getVulnerabilitiesByMode(
      Type.VulnerabilityMode.Local
    );

    if (vuls.length === 0) {
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(
      createMetaLib(
        mockEnvironment,
        computer,
        metaFile,
        computer,
        targetFile,
        Type.VulnerabilityMode.Local,
        libContainer,
        libVersion,
        vuls
      )
    );
  }
).addArgument('path');

export const netUse = CustomFunction.createExternalWithSelf(
  'net_use',
  (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Metaxploit.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, computer, metaFile } = self.variables;
    const ipAddress = args.get('ipAddress');
    const port = args.get('port');

    if (ipAddress instanceof CustomNil || port instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    const ipAddressRaw = ipAddress.toString();

    if (ipAddressRaw === '' || !Utils.isValidIp(ipAddressRaw)) {
      vm.handler.outputHandler.print(
        vm,
        `Invalid ip address:${ipAddressRaw}`
      );
      return Promise.resolve(DefaultType.Void);
    }

    let router: Type.Router = null;
    let isLan = false;

    if (Utils.isLanIp(ipAddressRaw)) {
      router = computer.getRouter() as Type.Router;
      isLan = true;
    } else {
      router = mockEnvironment.getRouterByIp(ipAddressRaw);
    }

    if (router == null) {
      vm.handler.outputHandler.print(vm, 'Ip address not found.');
      return Promise.resolve(DefaultType.Void);
    }

    const portRaw = port.toInt();

    if (portRaw === 0) {
      const kernel = router.getKernel();

      if (!kernel) {
        return Promise.resolve(DefaultType.Void);
      }

      return Promise.resolve(
        createNetSession(
          mockEnvironment,
          computer,
          metaFile,
          router,
          kernel,
          Type.Library.KERNEL_ROUTER
        )
      );
    }

    if (isLan) {
      const targetDevice = router.findByLanIp(ipAddressRaw);

      if (targetDevice == null) {
        vm.handler.outputHandler.print(
          vm,
          'Error: LAN computer not found.'
        );
        return Promise.resolve(DefaultType.Void);
      }

      const targetPort = targetDevice.findPort(portRaw);

      if (targetPort == null) {
        vm.handler.outputHandler.print(vm, 'Port not found.');
        return Promise.resolve(DefaultType.Void);
      }

      const targetFile = targetDevice.findLibraryFileByPort(targetPort);

      if (!targetFile) {
        return Promise.resolve(DefaultType.Void);
      }

      return Promise.resolve(
        createNetSession(
          mockEnvironment,
          computer,
          metaFile,
          targetDevice,
          targetFile,
          targetFile.getLibraryType()
        )
      );
    }

    const forwardedComputer = router.getForwarded(portRaw);

    if (forwardedComputer === null) {
      vm.handler.outputHandler.print(vm, 'Port not found.');
      return Promise.resolve(DefaultType.Void);
    }

    const forwardedComputerPort = forwardedComputer.ports.get(portRaw);

    if (forwardedComputerPort.isClosed) {
      vm.handler.outputHandler.print(vm, "can't connect: port closed.");
      return Promise.resolve(DefaultType.Void);
    }

    const targetFile = forwardedComputer.findLibraryFileByPort(
      forwardedComputerPort
    );

    if (!targetFile) {
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(
      createNetSession(
        mockEnvironment,
        computer,
        metaFile,
        forwardedComputer,
        targetFile,
        targetFile.getLibraryType()
      )
    );
  }
)
  .addArgument('ipAddress')
  .addArgument('port', new CustomNumber(0));

export const scan = CustomFunction.createExternalWithSelf(
  'scan',
  (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const metaLib = args.get('metaLib');

    if (metaLib instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    if (
      metaLib instanceof BasicInterface &&
      metaLib.getCustomType() === MetaLib.type
    ) {
      const metaFile = metaLib.getVariable('metaFile') as Type.File;

      if (!metaFile || metaFile.deleted) {
        vm.handler.outputHandler.print(
          vm,
          'Error: metaxploit lib missing.'
        );
        return Promise.resolve(DefaultType.Void);
      }

      const targetFile = metaLib.getVariable('targetFile') as Type.File;

      if (!targetFile || targetFile.deleted) {
        return Promise.resolve(DefaultType.Void);
      }

      const vuls = metaLib.getVariable(
        'vulnerabilities'
      ) as Type.Vulnerability[];
      const zones = vuls.map((x: Type.Vulnerability) => {
        return x.memAddress;
      });
      const result = Array.from(new Set(zones)).map(
        (item) => new CustomString(item)
      );

      return Promise.resolve(new CustomList(result));
    }

    return Promise.resolve(DefaultType.Void);
  }
).addArgument('metaLib');

export const scanAddress = CustomFunction.createExternalWithSelf(
  'scan_address',
  (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const metaLib = args.get('metaLib');
    const memAddress = args.get('memAddress');

    if (metaLib instanceof CustomNil || memAddress instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    if (
      metaLib instanceof BasicInterface &&
      metaLib.getCustomType() === MetaLib.type
    ) {
      const metaFile = metaLib.getVariable('metaFile') as Type.File;

      if (!metaFile || metaFile.deleted) {
        vm.handler.outputHandler.print(
          vm,
          'Error: metaxploit lib missing.'
        );
        return Promise.resolve(DefaultType.Void);
      }

      const targetFile = metaLib.getVariable('targetFile') as Type.File;

      if (!targetFile || targetFile.deleted) {
        return Promise.resolve(DefaultType.Void);
      }

      const memAddressRaw = memAddress.toString();
      const output = [
        'decompiling source...',
        'searching unsecure values...'
      ];
      const vuls = metaLib.getVariable(
        'vulnerabilities'
      ) as Type.Vulnerability[];
      const vulsOfAddress = vuls.filter((x: Type.Vulnerability) => {
        return x.memAddress === memAddressRaw;
      });

      if (vulsOfAddress.length === 0) {
        output.push('No vulnerabilities were found.');
        return Promise.resolve(new CustomString(output.join('\n')));
      }

      for (const item of vulsOfAddress) {
        output.push(`Unsafe check: ${item.getInfo()}\n`);
      }

      return Promise.resolve(new CustomString(output.join('\n')));
    }

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('metaLib')
  .addArgument('memAddress');

export const sniffer = CustomFunction.createExternalWithSelf(
  'sniffer',
  (
    _vm: VM,
    _self: CustomValue,
    _args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    return Promise.resolve(DefaultType.Void);
  }
);

export const rshellClient = CustomFunction.createExternalWithSelf(
  'rshell_client',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Metaxploit.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, computer, user } = self.variables;
    const address = args.get('address');
    const port = args.get('port');
    const procName = args.get('procName');

    if (
      address instanceof CustomNil ||
      port instanceof CustomNil ||
      procName instanceof CustomNil
    ) {
      return Promise.resolve(DefaultType.Void);
    }

    const addressRaw = address.toString();

    if (!Utils.isValidIp(addressRaw)) {
      return Promise.resolve(
        new CustomString('rshell_client: Invalid IP address')
      );
    }

    const procNameRaw = procName.toString();

    if (!isValidFileName(procNameRaw)) {
      return Promise.resolve(
        new CustomString(
          'Error: only alphanumeric allowed as proccess name.'
        )
      );
    } else if (greaterThanProcNameLimit(procNameRaw)) {
      return Promise.resolve(
        new CustomString(
          'Error: proccess name cannot exceed the limit of 28 characters.'
        )
      );
    } else if (isValidProcName(procNameRaw)) {
      return Promise.resolve(
        new CustomString(`Error: ${procNameRaw} is a reserved process name`)
      );
    }

    const router = mockEnvironment.getRouterByIp(addressRaw);

    if (router === null) {
      return Promise.resolve(
        new CustomString(
          `rshell_client: IP address not found: ${addressRaw}`
        )
      );
    }

    const portRaw = port.toInt();
    let target: Type.Device = router;

    if (router.isForwarded(portRaw)) {
      target = router.getForwarded(portRaw);
    }

    const targetPort = target.findPort(portRaw);

    if (targetPort === null) {
      return Promise.resolve(
        new CustomString(
          `rshell_client: unable to find remote server at port ${portRaw}`
        )
      );
    } else if (!target.services.has(Type.ServiceType.RSHELL)) {
      return Promise.resolve(
        new CustomString(
          `Unable to find service ${Type.ServiceType.RSHELL}`
        )
      );
    } else if (targetPort.service !== Type.ServiceType.RSHELL) {
      return Promise.resolve(
        new CustomString('Invalid target service port configuration.')
      );
    }

    const targetService = target.services.get(targetPort.service);

    if (targetService.libraryFile.deleted) {
      return Promise.resolve(
        new CustomString(
          `Unable to connect: missing ${Utils.getServiceLibrary(
            targetPort.service
          )}`
        )
      );
    } else if (targetService.libraryFile.type !== Type.FileType.RShell) {
      return Promise.resolve(
        new CustomString(
          `Unable to connect: invalid ${Utils.getServiceLibrary(
            targetPort.service
          )}`
        )
      );
    }

    const rshellDevices = targetService.data.get('computers') as Map<
      string,
      {
        user: Type.User;
        device: Type.Device;
      }
    >;
    const targetRouter = target.getRouter() as Type.Router;

    rshellDevices.set(targetRouter.publicIp, {
      user,
      device: computer
    });
    computer.addProcess({
      owner: user,
      command: procNameRaw
    });

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('address')
  .addArgument('port', new CustomNumber(1222))
  .addArgument('procName', new CustomString('rshell_client'));

export const rshellServer = CustomFunction.createExternalWithSelf(
  'rshell_server',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Metaxploit.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, computer } = self.variables;

    if (!computer.services.has(Type.ServiceType.RSHELL)) {
      return Promise.resolve(
        new CustomString('error: service rshelld is not running')
      );
    }

    const port = computer.findPortByService(Type.ServiceType.RSHELL);

    if (!computer.isForwarded(port.port)) {
      return Promise.resolve(
        new CustomString(
          'error: rshell portforward is not configured correctly'
        )
      );
    }

    const rshellServer = computer.services.get(Type.ServiceType.RSHELL);
    const rshellResults = rshellServer.data.get('computers') as Map<
      string,
      {
        user: Type.User;
        device: Type.Device;
      }
    >;
    const shells: BasicInterface[] = [];

    for (const rshellResult of rshellResults.values()) {
      shells.push(
        createShell(mockEnvironment, rshellResult.user, rshellResult.device)
      );
    }

    return Promise.resolve(new CustomList(shells));
  }
);

export interface MetaxploitVariables {
  mockEnvironment: GHMockIntrinsicEnv;
  metaFile: Type.File;
  user: Type.User;
  computer: Type.Device;
}

export class Metaxploit extends BasicInterface {
  static readonly type: string = 'MetaxploitLib';
  static readonly isa: GreyMap = new GreyMap([
    load,
    netUse,
    scan,
    scanAddress,
    sniffer,
    rshellClient,
    rshellServer
  ]);

  static retreive(args: Map<string, CustomValue>): Metaxploit | null {
    const intf = args.get('self');
    if (intf instanceof Metaxploit) {
      return intf;
    }
    return null;
  }

  variables: MetaxploitVariables;

  constructor(variables: MetaxploitVariables) {
    super(Metaxploit.type, Metaxploit.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: GHMockIntrinsicEnv,
  metaFile: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new Metaxploit({
    mockEnvironment,
    metaFile,
    user,
    computer
  });

  return itrface;
}
