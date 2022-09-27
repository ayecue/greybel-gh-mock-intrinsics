import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';
import { EmailGenerator } from 'greybel-mock-environment/dist/generators';

import BasicInterface from './interface';

export function create(
  mockEnvironment: MockEnvironment,
  email: Type.EMail
): BasicInterface {
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
          const firstMessage = item.messages[0];

          result.push(
            new CustomString(
              [
                '\n\nMailID: ',
                id,
                '\nFrom: ',
                item.from,
                '\nSubject: ',
                item.subject,
                '\n',
                (firstMessage.length > 125 ? firstMessage.substr(0, 125) + '...' : firstMessage).replace('\n\n', '\n')
              ].join('')
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
        const mailId = args.get('id');

        if (mailId instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const mailIdRaw = mailId.toString();

        if (!email.messages.has(mailIdRaw)) {
          return Promise.resolve(new CustomString('Mail not found'));
        }

        const item = email.messages.get(mailIdRaw);

        const output = [
          '\nFrom: ',
          item.from,
          '\nSubject: ',
          item.subject,
          '\n'
        ];

        for (const message of item.messages) {
          output.push(`${message}\n\n`);
        }

        return Promise.resolve(
          new CustomString(
            output.join('')
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
        const subject = args.get('subject');
        const message = args.get('message');

        if (address instanceof CustomNil || subject instanceof CustomNil || message instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const addressRaw = address.toString();
        const addressSegments = addressRaw.split('@');

        if (addressSegments.length === 1 || addressSegments[0].length === 0 || addressRaw.length > 64) {
          return Promise.resolve(new CustomString('Invalid email address'));
        }

        const subjectRaw = subject.toString();

        if (subjectRaw.length > 128) {
          return Promise.resolve(new CustomString('Mail subject too large'));
        }

        const messageRaw = message.toString();

        if (messageRaw.length > 160000) {
          return Promise.resolve(new CustomString('Mail message too large'));
        }

        const targetEmail = mockEnvironment.getEmail(addressRaw);
        const newEmail = new Type.EMailMessage(
          email.email,
          subjectRaw,
          [messageRaw]
        );

        targetEmail.messages.set(
          mockEnvironment.basicGenerator.generateUUID(),
          newEmail
        );

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
        const mailId = args.get('id');

        if (mailId instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const mailIdRaw = mailId.toString();

        if (email.messages.delete(mailIdRaw)) {
          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('id')
  );

  return itrface;
}
