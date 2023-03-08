import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type, Utils } from 'greybel-mock-environment';

import BasicInterface from './interface';
import { create as createMetaLib } from './meta-lib';
import { create as createNetSession } from './net-session';
import { create as createShell } from './shell';
import {
  greaterThanProcNameLimit,
  isValidFileName,
  isValidProcName
} from './utils';

export function create(
  mockEnvironment: MockEnvironment,
  metaFile: Type.File,
  user: Type.User,
  computer: Type.Device
): BasicInterface {
  const itrface = new BasicInterface('metaxploit');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'load',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path');

        if (path instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const pathRaw = path.toString();

        if (pathRaw === '') {
          throw new Error('load: Invalid arguments');
        }

        const traversalPath = Utils.getTraversalPath(
          pathRaw,
          computer.getHomePath(user)
        );
        const targetFile = computer.getFile(traversalPath) as Type.File;

        if (!targetFile) {
          return Promise.resolve(Defaults.Void);
        }

        const library = targetFile.getLibraryType();

        if (!library) {
          return Promise.resolve(Defaults.Void);
        }

        const libContainer = mockEnvironment.libraryManager.get(library);
        const libVersion = libContainer.get(targetFile.version);
        const vuls = libVersion.getVulnerabilitiesByMode(
          Type.VulnerabilityMode.Local
        );

        if (vuls.length === 0) {
          return Promise.resolve(Defaults.Void);
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
    ).addArgument('path')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'net_use',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const ipAddress = args.get('ipAddress');
        const port = args.get('port');

        if (ipAddress instanceof CustomNil || port instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const ipAddressRaw = ipAddress.toString();

        if (ipAddressRaw === '' || !Utils.isValidIp(ipAddressRaw)) {
          ctx.handler.outputHandler.print(`Invalid ip address:${ipAddressRaw}`);
          return Promise.resolve(Defaults.Void);
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
          ctx.handler.outputHandler.print('Ip address not found.');
          return Promise.resolve(Defaults.Void);
        }

        const portRaw = port.toInt();

        if (portRaw === 0) {
          const kernel = router.getKernel();

          if (!kernel) {
            return Promise.resolve(Defaults.Void);
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
            ctx.handler.outputHandler.print('Error: LAN computer not found.');
            return Promise.resolve(Defaults.Void);
          }

          const targetPort = targetDevice.findPort(portRaw);

          if (targetPort == null) {
            ctx.handler.outputHandler.print('Port not found.');
            return Promise.resolve(Defaults.Void);
          }

          const targetFile = targetDevice.findLibraryFileByPort(targetPort);

          if (!targetFile) {
            return Promise.resolve(Defaults.Void);
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
          ctx.handler.outputHandler.print('Port not found.');
          return Promise.resolve(Defaults.Void);
        }

        const forwardedComputerPort = forwardedComputer.ports.get(portRaw);

        if (forwardedComputerPort.isClosed) {
          ctx.handler.outputHandler.print("can't connect: port closed.");
          return Promise.resolve(Defaults.Void);
        }

        const targetFile = forwardedComputer.findLibraryFileByPort(
          forwardedComputerPort
        );

        if (!targetFile) {
          return Promise.resolve(Defaults.Void);
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
      .addArgument('port', new CustomNumber(0))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'scan',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const metaLib = args.get('metaLib');

        if (metaLib instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        if (
          metaLib instanceof BasicInterface &&
          metaLib.getCustomType() === 'metaLib'
        ) {
          const metaFile = metaLib.getVariable('metaFile') as Type.File;

          if (!metaFile || metaFile.deleted) {
            ctx.handler.outputHandler.print('Error: metaxploit lib missing.');
            return Promise.resolve(Defaults.Void);
          }

          const targetFile = metaLib.getVariable('targetFile') as Type.File;

          if (!targetFile || targetFile.deleted) {
            return Promise.resolve(Defaults.Void);
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

        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('metaLib')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'scan_address',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const metaLib = args.get('metaLib');
        const memAddress = args.get('memAddress');

        if (metaLib instanceof CustomNil || memAddress instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        if (
          metaLib instanceof BasicInterface &&
          metaLib.getCustomType() === 'metaLib'
        ) {
          const metaFile = metaLib.getVariable('metaFile') as Type.File;

          if (!metaFile || metaFile.deleted) {
            ctx.handler.outputHandler.print('Error: metaxploit lib missing.');
            return Promise.resolve(Defaults.Void);
          }

          const targetFile = metaLib.getVariable('targetFile') as Type.File;

          if (!targetFile || targetFile.deleted) {
            return Promise.resolve(Defaults.Void);
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
            output.push(`Unsafe check: ${item.getInfo()}`);
          }

          return Promise.resolve(new CustomString(output.join('\n')));
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('metaLib')
      .addArgument('memAddress')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'sniffer',
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
      'rshell_client',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const address = args.get('address');
        const port = args.get('port');
        const procName = args.get('procName');

        if (
          address instanceof CustomNil ||
          port instanceof CustomNil ||
          procName instanceof CustomNil
        ) {
          return Promise.resolve(Defaults.Void);
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

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('address')
      .addArgument('port', new CustomNumber(1222))
      .addArgument('procName', new CustomString('rshell_client'))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'rshell_server',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
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
    )
  );

  return itrface;
}
