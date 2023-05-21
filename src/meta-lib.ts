import {
  CustomFunction,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type, Utils } from 'greybel-mock-environment';

import { create as createComputer } from './computer';
import { create as createFile } from './file';
import BasicInterface from './interface';
import { create as createShell } from './shell';
import { greaterThanEntityNameLimit, isAlphaNumeric } from './utils';

export interface MetaLibVariables {
  mockEnvironment: MockEnvironment;
  source: Type.Device;
  metaFile: Type.File;
  target: Type.Device;
  targetFile: Type.File;
  targetMode: Type.VulnerabilityMode;
  targetLibContainer: Type.LibraryContainer;
  targetLibVersion: Type.LibraryVersion;
  vulnerabilities: Type.Vulnerability[];
}

export class MetaLib extends BasicInterface {
  static readonly type: string = 'MetaLib';
  static readonly customIntrinsics: CustomFunction[] = [
    CustomFunction.createExternalWithSelf(
      'lib_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaLib.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { targetFile } = self.variables;
        return Promise.resolve(new CustomString(targetFile.getLibraryType()));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'version',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaLib.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { targetFile } = self.variables;
        return Promise.resolve(new CustomString(targetFile.version.toString()));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'overflow',
      (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaLib.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { targetFile, vulnerabilities, target, source, mockEnvironment } =
          self.variables;
        const memAddress = args.get('memAddress');
        const sector = args.get('sector');
        const optArgs = args.get('optArgs');

        if (memAddress instanceof CustomNil || sector instanceof CustomNil) {
          throw new Error('overflow: Invalid arguments');
        }

        if (!targetFile.getPath().startsWith('/lib')) {
          ctx.handler.outputHandler.print(
            ctx,
            'Exploit failed. The library must be found on the /lib path'
          );
          return Promise.resolve(DefaultType.Void);
        }

        const memAddressRaw = memAddress.toString();
        const sectorRaw = sector.toString();
        const optArgsRaw = optArgs.toString();
        const targetVul = vulnerabilities.find((item: Type.Vulnerability) => {
          return item.memAddress === memAddressRaw && item.sector === sectorRaw;
        });

        if (!targetVul) {
          ctx.handler.outputHandler.print(
            ctx,
            'Exploit failed. Vulnerability not found.'
          );
          return Promise.resolve(DefaultType.Void);
        }

        let output = '';

        for (const item of targetVul.required) {
          switch (item) {
            case Type.VulnerabilityRequirements.Library: {
              const requiredLib = targetVul.data.get(
                'library'
              ) as Type.VulnerabilityLibraryRequirement;
              const libFile = target.findLibraryFile(requiredLib.library);

              output += `Searching required library ${requiredLib.library}.so`;

              if (libFile === null) {
                output +=
                  ' => failed. Required lib not found. Program aborted.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }

              if (requiredLib.version.isLessThan(libFile.version)) {
                output += ' => found!\nStarting attack... failed!\nRequired ';
                output += `${requiredLib.library}.so`;
                output += ' installed library at version >= ';
                output += requiredLib.version.toString();
                output += '. Target insalled version is: ';
                output += libFile.version.toString();
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }

              output += ' => found!\n';
              break;
            }
            case Type.VulnerabilityRequirements.RegisterAmount: {
              const registeredUsers = targetVul.data.get(
                'registeredUsers'
              ) as number;
              const targetUsers = target.users.size;

              if (targetUsers < registeredUsers) {
                output +=
                  'Starting attack... failed!\nMin users registered failed.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
            case Type.VulnerabilityRequirements.AnyActive: {
              if (!target.isAnyProcessActive()) {
                output += 'Starting attack... failed!\nNo active user found.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
            case Type.VulnerabilityRequirements.RootActive: {
              if (!target.isRootProcessActive()) {
                output +=
                  'Starting attack... failed!\nNo active root user found.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
            case Type.VulnerabilityRequirements.Local: {
              if (!(target instanceof Type.Router)) {
                output +=
                  'Starting attack... failed!\nTarget must be a router.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              if (!target.isDeviceInNetwork(source)) {
                output +=
                  'Starting attack... failed!\nHost computer not in the same network.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
            case Type.VulnerabilityRequirements.Forward: {
              const portsForwarded = targetVul.data.get(
                'portsForwarded'
              ) as number;
              const router = target.getRouter() as Type.Router;

              if (router.forwarded.size > portsForwarded) {
                output +=
                  'Starting attack... failed!\nInsufficient amount of port forward towards the target.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
            case Type.VulnerabilityRequirements.Gateway: {
              const connGateway = targetVul.data.get('connGateway') as number;
              const router = target.getRouter() as Type.Router;

              if (router.devices.size > connGateway) {
                output +=
                  'Starting attack... failed!\nInsufficient amount of computers connected to this gateway.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
              break;
            }
          }
        }

        output += '\nStarting attack...';

        let vulTargetUser;

        if (targetVul.action !== Type.VulnerabilityAction.Computer) {
          const vulUser = targetVul.data.get(
            'user'
          ) as Type.VulnerabilityActionUser;
          vulTargetUser = target.getUserByVulnerability(vulUser);

          if (vulTargetUser === null) {
            output += 'failed. Unable to find non root user in computer.';
            ctx.handler.outputHandler.print(ctx, output);
            return Promise.resolve(DefaultType.Void);
          }
        }

        switch (targetVul.action) {
          case Type.VulnerabilityAction.Shell: {
            output += `success!\nPrivileges obtained from user: ${vulTargetUser.username}`;
            ctx.handler.outputHandler.print(ctx, output);

            return Promise.resolve(
              createShell(mockEnvironment, vulTargetUser, target)
            );
          }
          case Type.VulnerabilityAction.Folder: {
            const vulRandomFolderPath = targetVul.data.get(
              'folder'
            ) as string[];
            const vulRandomFolder = target.getFile(vulRandomFolderPath);

            if (vulRandomFolder === null) {
              output += `failed. can't access to resource: ${vulRandomFolderPath}`;
              ctx.handler.outputHandler.print(ctx, output);
              return Promise.resolve(DefaultType.Void);
            }

            output += `success!\nPrivileges obtained from user: ${vulTargetUser.username}`;
            ctx.handler.outputHandler.print(ctx, output);

            return Promise.resolve(
              createFile(
                mockEnvironment,
                vulTargetUser,
                target,
                vulRandomFolder
              )
            );
          }
          case Type.VulnerabilityAction.Password: {
            if (optArgsRaw === '' || !isAlphaNumeric(optArgsRaw)) {
              output += `success!\nExecuting payload...\nerror: can't change password for user ${vulTargetUser.username}. Password must be alphanumeric.`;
              ctx.handler.outputHandler.print(ctx, output);
              return Promise.resolve(DefaultType.False);
            } else if (greaterThanEntityNameLimit(optArgsRaw)) {
              output += 'password cannot exceed the 15 character limit.';
              ctx.handler.outputHandler.print(ctx, output);
              return Promise.resolve(DefaultType.False);
            }

            target.changePassword(vulTargetUser.username, optArgsRaw);
            output += `success\nExecuting payload...\nPassword for user ${vulTargetUser.username} modified OK.`;
            ctx.handler.outputHandler.print(ctx, output);

            return Promise.resolve(DefaultType.True);
          }
          case Type.VulnerabilityAction.Computer: {
            const computerTarget = target;

            if (target instanceof Type.Router) {
              if (optArgsRaw === '' || !Utils.isValidIp(optArgsRaw)) {
                output += 'Failed!\nNo lan ip indicated or invalid.';
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }

              const lanTarget = target.findByLanIp(optArgsRaw);

              if (lanTarget === null) {
                output += `Failed!\nNo computer found at address: ${optArgsRaw}`;
                ctx.handler.outputHandler.print(ctx, output);
                return Promise.resolve(DefaultType.Void);
              }
            }

            const vulUser = targetVul.data.get(
              'user'
            ) as Type.VulnerabilityActionUser;
            vulTargetUser = computerTarget.getUserByVulnerability(vulUser);

            if (vulTargetUser === null) {
              output += 'failed. Unable to find non root user in computer.';
              ctx.handler.outputHandler.print(ctx, output);
              return Promise.resolve(DefaultType.Void);
            }

            output += `success!\nComputer obtained with credentials from user: ${vulTargetUser.username}`;
            ctx.handler.outputHandler.print(ctx, output);

            return Promise.resolve(
              createComputer(mockEnvironment, vulTargetUser, computerTarget)
            );
          }
          case Type.VulnerabilityAction.Firewall: {
            if (!(target instanceof Type.Router)) {
              output += 'Failed!\nTarget must be a router.';
              ctx.handler.outputHandler.print(ctx, output);
              return Promise.resolve(DefaultType.False);
            }

            output +=
              'success!\nAccessing firewall config...\nFirewall disabled. (Firewalls are not yet supported in greybel!)';
            ctx.handler.outputHandler.print(ctx, output);
            return Promise.resolve(DefaultType.True);
          }
        }

        return Promise.resolve(DefaultType.Void);
      }
    )
      .addArgument('memAddress')
      .addArgument('sector')
      .addArgument('optArgs')
  ];

  static retreive(args: Map<string, CustomValue>): MetaLib | null {
    const intf = args.get('self');
    if (intf instanceof MetaLib) {
      return intf;
    }
    return null;
  }

  variables: MetaLibVariables;

  constructor(variables: MetaLibVariables) {
    super(MetaLib.type);
    this.variables = variables;
    MetaLib.customIntrinsics.forEach(this.addMethod.bind(this));
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  source: Type.Device,
  metaFile: Type.File,
  target: Type.Device,
  targetFile: Type.File,
  targetMode: Type.VulnerabilityMode,
  targetLibContainer: Type.LibraryContainer,
  targetLibVersion: Type.LibraryVersion,
  vulnerabilities: Type.Vulnerability[]
): BasicInterface {
  const itrface = new MetaLib({
    mockEnvironment,
    source,
    metaFile,
    target,
    targetFile,
    targetMode,
    targetLibContainer,
    targetLibVersion,
    vulnerabilities
  });

  return itrface;
}
