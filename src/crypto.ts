import {
  CustomFunction,
  CustomList,
  CustomNumber,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { FS, Type } from 'greybel-mock-environment';

import BasicInterface from './interface';
import mockEnvironment from './mock/environment';

export function create(
  user: Type.User,
  computer: Type.Computer
): BasicInterface {
  const itrface = new BasicInterface('crypto');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'aireplay',
      async (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const bssid = args.get('bssid').toString();
        const essid = args.get('essid').toString();
        // Not yet implemented
        // const maxAcks = args.get('maxAcks').toInt();
        const network = mockEnvironment
          .get()
          .networkGenerator.wifiNetworks.find((item: Type.WifiNetwork) => {
            return item.router.bssid === bssid && item.router.essid === essid;
          });

        if (!network) {
          return new CustomString('No network found');
        }

        const time = 300000 / (network.percentage + 15);

        await ctx.handler.outputHandler.progress(time);

        const folder = FS.getFile(
          computer.fileSystem,
          FS.getHomePath(user, computer)
        ) as Type.Folder;

        FS.putFile(folder, {
          name: 'file.cap',
          content: network.password,
          owner: user.username,
          permissions: 'drwxr--r--',
          type: Type.FileType.Ack
        });

        return Defaults.Void;
      }
    )
      .addArgument('bssid')
      .addArgument('essid')
      .addArgument('maxAcks', new CustomNumber(25000))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'airmon',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('start'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'aircrack',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const path = args.get('path').toString();
        const traversalPath = FS.getTraversalPath(
          path,
          FS.getHomePath(user, computer)
        );
        const file = FS.getFile(computer.fileSystem, traversalPath) as Type.File;

        if (!file) {
          return Promise.resolve(Defaults.Void);
        }

        const { r } = FS.getPermissions(user, file);

        if (!r) {
          return Promise.resolve(Defaults.Void);
        }

        if (file.type !== Type.FileType.Ack) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(new CustomString(file.content));
      }
    ).addArgument('path')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'decipher',
      async (
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const encryptedPass = args.get('encryptedPass').toString();

        await ctx.handler.outputHandler.progress(5000);

        const user = mockEnvironment
          .get()
          .userGenerator.users.find((item: Type.User) => {
            return item.passwordHashed === encryptedPass;
          });

        if (!user) {
          return Defaults.Void;
        }

        return new CustomString(user.password);
      }
    ).addArgument('encryptedPass')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'smtp_user_list',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomList());
      }
    )
  );

  return itrface;
}
