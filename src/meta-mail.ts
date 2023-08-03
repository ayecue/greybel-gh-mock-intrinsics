import {
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';

export interface MetaMailVariables {
  mockEnvironment: MockEnvironment;
  email: Type.EMail;
}

export class MetaMail extends BasicInterface {
  static readonly type: string = 'MetaMail';
  static readonly isa: GreyMap = new GreyMap([
    CustomFunction.createExternalWithSelf(
      'fetch',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaMail.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { email } = self.variables;
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
                (firstMessage.length > 125
                  ? firstMessage.substr(0, 125) + '...'
                  : firstMessage
                ).replace('\n\n', '\n')
              ].join('')
            )
          );
        });

        return Promise.resolve(new CustomList(result));
      }
    ),

    CustomFunction.createExternalWithSelf(
      'read',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaMail.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { email } = self.variables;
        const mailId = args.get('id');

        if (mailId instanceof CustomNil) {
          return Promise.resolve(DefaultType.Void);
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

        return Promise.resolve(new CustomString(output.join('')));
      }
    ).addArgument('id'),

    CustomFunction.createExternalWithSelf(
      'send',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaMail.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { email, mockEnvironment } = self.variables;
        const address = args.get('address');
        const subject = args.get('subject');
        const message = args.get('message');

        if (
          address instanceof CustomNil ||
          subject instanceof CustomNil ||
          message instanceof CustomNil
        ) {
          return Promise.resolve(DefaultType.Void);
        }

        const addressRaw = address.toString();
        const addressSegments = addressRaw.split('@');

        if (
          addressSegments.length === 1 ||
          addressSegments[0].length === 0 ||
          addressRaw.length > 64
        ) {
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
        const newEmail = new Type.EMailMessage(email.email, subjectRaw, [
          messageRaw
        ]);

        targetEmail.messages.set(
          mockEnvironment.basicGenerator.generateUUID(),
          newEmail
        );

        return Promise.resolve(DefaultType.True);
      }
    )
      .addArgument('address')
      .addArgument('subject')
      .addArgument('message'),

    CustomFunction.createExternalWithSelf(
      'delete',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const self = MetaMail.retreive(args);

        if (self === null) {
          return Promise.resolve(DefaultType.Void);
        }

        const { email } = self.variables;
        const mailId = args.get('id');

        if (mailId instanceof CustomNil) {
          return Promise.resolve(DefaultType.Void);
        }

        const mailIdRaw = mailId.toString();

        if (email.messages.delete(mailIdRaw)) {
          return Promise.resolve(DefaultType.True);
        }

        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('id')
  ]);

  static retreive(args: Map<string, CustomValue>): MetaMail | null {
    const intf = args.get('self');
    if (intf instanceof MetaMail) {
      return intf;
    }
    return null;
  }

  variables: MetaMailVariables;

  constructor(variables: MetaMailVariables) {
    super(MetaMail.type, MetaMail.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  email: Type.EMail
): BasicInterface {
  const itrface = new MetaMail({
    mockEnvironment,
    email
  });

  return itrface;
}
