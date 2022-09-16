import {
  CustomBoolean,
  CustomFunction,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import { create as createComputer } from './computer';
import { create as createFile } from './file';
import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { create as createShell } from './shell';
import { Type } from 'greybel-mock-environment';
import { changePassword, getFile, getUserByVulnerability } from './utils';

export function create(
  computer: Type.Computer,
  targetComputer: Type.Computer,
  library: Type.Library
): BasicInterface {
  const itrface = new BasicInterface('metaLib');
  const isRouter =
    (targetComputer as Type.Router).publicIp && targetComputer.router == null;
  const isLan = isRouter
    ? computer.router.publicIp === (targetComputer as Type.Router).publicIp
    : computer.router.publicIp === targetComputer.router.publicIp;
  const isLocal = isLan && computer.localIp === targetComputer.localIp;
  const exploits = mockEnvironment.get().vulnerabilities.filter(
    (item: Type.Vulnerability) => {
      return item.library === library && item.remote !== isLocal;
    }
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'lib_name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(library));
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
        return Promise.resolve(new CustomString('1.0.0.0'));
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
        const vul = exploits.find((item: Type.Vulnerability) => {
          return item.memAddress === memAddress && item.sector === sector;
        });

        if (!vul) {
          return Promise.resolve(Defaults.Void);
        }

        switch (vul.action) {
          case Type.VulnerabilityAction.COMPUTER:
            return Promise.resolve(
              createComputer(
                getUserByVulnerability(vul.user, targetComputer),
                targetComputer
              )
            );
          case Type.VulnerabilityAction.SHELL:
            return Promise.resolve(
              createShell(
                getUserByVulnerability(vul.user, targetComputer),
                targetComputer
              )
            );
          case Type.VulnerabilityAction.FOLDER: {
            const file = getFile(targetComputer.fileSystem, vul.folder);
            return Promise.resolve(
              createFile(getUserByVulnerability(vul.user, targetComputer), file)
            );
          }
          case Type.VulnerabilityAction.FIREWALL:
            return Promise.resolve(new CustomString('Firewall test'));
          case Type.VulnerabilityAction.PASSWORD: {
            if (!optArgs) {
              return Promise.resolve(new CustomString('Invalid args'));
            }
            const user = getUserByVulnerability(vul.user, targetComputer);
            return Promise.resolve(
              new CustomBoolean(
                changePassword(targetComputer, user.username, optArgs)
              )
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

  itrface.setVariable('exploits', exploits);

  return itrface;
}
