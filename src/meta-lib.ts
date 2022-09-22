import {
  CustomBoolean,
  CustomFunction,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { Type } from 'greybel-mock-environment';
import { Router } from 'greybel-mock-environment/dist/types';

import { create as createComputer } from './computer';
import { create as createFile } from './file';
import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { create as createShell } from './shell';

export function create(
  computer: Type.Computer,
  target: Type.Device,
  library: Type.Library
): BasicInterface {
  const itrface = new BasicInterface('metaLib');
  const isRouter = target instanceof Router;
  const isLan = isRouter
    ? computer.router.publicIp === target.publicIp
    : computer.router.publicIp === (target as Type.Computer).router.publicIp;
  const isLocal = isLan && computer.localIp === target.localIp;
  const exploits = mockEnvironment
    .get()
    .vulnerabilityGenerator.vulnerabilities.filter(
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
              createComputer(target.getUserByVulnerability(vul.user), target)
            );
          case Type.VulnerabilityAction.SHELL:
            return Promise.resolve(
              createShell(target.getUserByVulnerability(vul.user), target)
            );
          case Type.VulnerabilityAction.FOLDER: {
            const file = target.getFile(vul.folder);
            return Promise.resolve(
              createFile(target.getUserByVulnerability(vul.user), target, file)
            );
          }
          case Type.VulnerabilityAction.FIREWALL:
            return Promise.resolve(new CustomString('Firewall test'));
          case Type.VulnerabilityAction.PASSWORD: {
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

  itrface.setVariable('exploits', exploits);

  return itrface;
}
