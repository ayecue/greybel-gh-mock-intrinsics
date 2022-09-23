import {
  CustomBoolean,
  CustomFunction,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import { create as createComputer } from './computer';
import { create as createFile } from './file';
import BasicInterface from './interface';
import { create as createShell } from './shell';

export function create(
  mockEnvironment: MockEnvironment,
  computer: Type.Computer,
  target: Type.Device,
  file: Type.File,
  mode: Type.VulnerabilityMode,
  libContainer: Type.LibraryContainer,
  libVersion: Type.LibraryVersion,
  vulnerabilities: Type.Vulnerability[]
): BasicInterface {
  const itrface = new BasicInterface('metaLib');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'lib_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(file.getLibraryType()));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'version',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(file.version.toString()));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'overflow',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const memAddress = args.get('memAddress').toString();
        const sector = args.get('sector').toString();
        const optArgs = args.get('optArgs').toString();
        const vul = vulnerabilities.find((item: Type.Vulnerability) => {
          return item.memAddress === memAddress && item.sector === sector;
        });

        if (!vul) {
          return Promise.resolve(Defaults.Void);
        }

        switch (vul.action) {
          case Type.VulnerabilityAction.Computer:
            return Promise.resolve(
              createComputer(
                mockEnvironment,
                target.getUserByVulnerability(vul.user),
                target
              )
            );
          case Type.VulnerabilityAction.Shell:
            return Promise.resolve(
              createShell(
                mockEnvironment,
                target.getUserByVulnerability(vul.user),
                target
              )
            );
          case Type.VulnerabilityAction.Folder: {
            const file = target.getFile(vul.folder);
            return Promise.resolve(
              createFile(
                mockEnvironment,
                target.getUserByVulnerability(vul.user),
                target,
                file
              )
            );
          }
          case Type.VulnerabilityAction.Firewall:
            return Promise.resolve(new CustomString('Firewall test'));
          case Type.VulnerabilityAction.Password: {
            if (!optArgs) {
              return Promise.resolve(new CustomString('Invalid args'));
            }
            const user = target.getUserByVulnerability(vul.user);
            return Promise.resolve(
              new CustomBoolean(target.changePassword(user.username, optArgs))
            );
          }
        }

        return Promise.resolve(Defaults.Void);
      }
    )
      .addArgument('memAddress')
      .addArgument('sector')
      .addArgument('optArgs')
  );

  itrface.setVariable('exploits', vulnerabilities);

  return itrface;
}
