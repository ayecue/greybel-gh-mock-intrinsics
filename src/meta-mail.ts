import {
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import mockEnvironment from './mock/environment';
import { Type } from 'greybel-mock-environment';

export function create(email: Type.EMail): BasicInterface {
  const itrface = new BasicInterface('metaMail');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'fetch',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const result: Array<CustomValue> = [];

        email.messages.forEach((item, id) => {
          result.push(
            new CustomString(
              [`${id} - ${item.subject}`, item.message].join('\n')
            )
          );
        });

        return Promise.resolve(new CustomList(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'read',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const mailId = args.get('id').toString();
        const item = email.messages.get(mailId);

        if (!item) {
          return;
        }

        return Promise.resolve(
          new CustomString(
            [`${mailId} - ${item.subject}`, item.message].join('\n')
          )
        );
      }
    ).addArgument('id')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'send',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const address = args.get('address');
        const subject = args.get('subject').toString();
        const message = args.get('message').toString();
        const targetEmail = mockEnvironment.get().getEmail(address.toString());

        if (!targetEmail) {
          return Promise.resolve(new CustomString('No email found'));
        }

        targetEmail.messages.set(mockEnvironment.get().generateUUID(), {
          subject,
          message
        });

        return Promise.resolve(Defaults.True);
      }
    )
      .addArgument('address')
      .addArgument('subject')
      .addArgument('message')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const mailId = args.get('id').toString();

        if (email.messages.delete(mailId)) {
          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(new CustomString('No email with that id.'));
      }
    ).addArgument('id')
  );

  return itrface;
}
