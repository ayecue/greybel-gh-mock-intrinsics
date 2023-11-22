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
import {
  MockEnvironment,
  RouterLocation,
  Type,
  Utils
} from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import { delay } from './utils';

export const aireplay = CustomFunction.createExternalWithSelf(
  'aireplay',
  async (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Crypto.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, device } = self.variables;
    const bssid = args.get('bssid');
    const essid = args.get('essid');
    const maxAcks = args.get('maxAcks');

    if (
      bssid instanceof CustomNil ||
      essid instanceof CustomNil ||
      maxAcks instanceof CustomNil
    ) {
      throw new Error('aireplay: Invalid arguments');
    }

    const bssidRaw = bssid.toString();
    const essidRaw = essid.toString();
    const maxAcksRaw = maxAcks.toInt();

    const network = mockEnvironment
      .findRoutersCloseToLocation(device.location)
      .find(({ router }: RouterLocation) => {
        return router.mac === bssidRaw && router.wifi.name === essidRaw;
      });

    if (!network) {
      return new CustomString("Can't connect. Target is out of reach.");
    }

    const activeWifiDevices = device
      .findNetworkDevicesByNetCard(Type.NetCard.Wifi)
      .filter((n) => n.active && n.mode === Type.NetworkDeviceMode.Monitor);

    if (activeWifiDevices.length === 0) {
      return new CustomString(
        'aireplay: no wifi card found with monitor mode enabled'
      );
    }

    const output = [
      `Waiting for beacon frame (BSSID: ${bssidRaw})`,
      'Sending Authentication Request (Open system) [ACK]',
      'Authentication succesful',
      'Sending Association Request\nAssociation succesful :-)'
    ].join('\n');

    vm.handler.outputHandler.print(vm, output);
    let acks = 0;

    vm.handler.outputHandler.print(vm, `${acks}/${maxAcksRaw}`);

    let didExit = false;
    const onExit = function() {
      didExit = true;
    };

    vm.getSignal().once('exit', onExit);

    /* eslint-disable-next-line no-unmodified-loop-condition */
    while (acks < maxAcksRaw && !didExit) {
      vm.handler.outputHandler.print(vm, `${acks}/${maxAcksRaw}`, {
        replace: true
      });
      acks += Utils.getRandomInt(250, 750);
      await delay(500);
    }

    vm.getSignal().off('exit', onExit);

    vm.handler.outputHandler.print(vm, `${acks}/${maxAcksRaw}`, {
      replace: true
    });

    const n = 300000 / (network.percentage + 15);

    if (acks >= n) {
      const folder = device.getFile(
        device.getHomePath(user)
      ) as Type.Folder;

      folder.putEntity(
        new Type.File({
          name: 'file.cap',
          content: [
            acks,
            network.percentage,
            network.router.wifi.credentials.password
          ].join(','),
          owner: user.username,
          permissions: 'rwxr--r--',
          type: Type.FileType.Ack
        })
      );
    }

    return DefaultType.Void;
  }
)
  .addArgument('bssid')
  .addArgument('essid')
  .addArgument('maxAcks', new CustomNumber(25000));

export const airmon = CustomFunction.createExternalWithSelf(
  'airmon',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Crypto.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { device } = self.variables;
    const option = args.get('option');
    const deviceName = args.get('device');

    if (option instanceof CustomNil || device instanceof CustomNil) {
      return Promise.resolve(DefaultType.False);
    }

    const optionRaw = option.toString();
    const deviceNameRaw = deviceName.toString();

    if (
      optionRaw === '' ||
      deviceNameRaw === '' ||
      deviceNameRaw.length > 5
    ) {
      return Promise.resolve(DefaultType.False);
    }

    const activeWifiDevices = device
      .findNetworkDevicesByNetCard(Type.NetCard.Wifi)
      .filter((n) => n.active);

    if (activeWifiDevices.length === 0) {
      return Promise.resolve(
        new CustomString('Error: wifi card is disabled')
      );
    }

    const map = device.getNetworkDeviceMap();

    if (!map.has(deviceNameRaw)) {
      return Promise.resolve(DefaultType.False);
    }

    const netDevice = map.get(deviceNameRaw);

    if (netDevice.type !== Type.NetCard.Wifi) {
      return Promise.resolve(
        new CustomString(
          'airmon: monitor mode can only be activated on wifi cards'
        )
      );
    }

    netDevice.mode = Type.NetworkDeviceMode.Monitor;

    return Promise.resolve(DefaultType.True);
  }
)
  .addArgument('option')
  .addArgument('device');

export const aircrack = CustomFunction.createExternalWithSelf(
  'aircrack',
  (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Crypto.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment, user, device } = self.variables;
    const path = args.get('path');

    if (path instanceof CustomNil) {
      throw new Error('aircrack: Invalid arguments');
    }

    const pathRaw = path.toString();

    if (pathRaw === '') {
      throw new Error('aircrack: Invalid arguments');
    }

    const traversalPath = Utils.getTraversalPath(
      pathRaw,
      mockEnvironment.getLatestSession().currentPath.getTraversalPath()
    );
    const entity = device.getFile(traversalPath);

    if (entity === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { r } = entity.getPermissionsForUser(user, device.groups);

    if (!r) {
      vm.handler.outputHandler.print(
        vm,
        "Can't open file. Permission denied"
      );
      return Promise.resolve(DefaultType.Void);
    }

    if (
      !(entity instanceof Type.File) ||
      entity.type !== Type.FileType.Ack
    ) {
      vm.handler.outputHandler.print(
        vm,
        "Can't process file. Not valid filecap."
      );
      return Promise.resolve(DefaultType.Void);
    }

    const [acks, power, password] = entity.content.split(',');
    const numAcks = Number(acks);
    const numPower = Number(power);
    const n = 300000 / (numPower + 15);

    if (numAcks < n) {
      vm.handler.outputHandler.print(
        vm,
        'Key not found. More acks needed'
      );
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(new CustomString(password));
  }
).addArgument('path');

export const decipher = CustomFunction.createExternalWithSelf(
  'decipher',
  async (
    vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = Crypto.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { mockEnvironment } = self.variables;
    const encryptedPass = args.get('encryptedPass').toString();

    await vm.handler.outputHandler.progress(vm, 5000);

    const user = mockEnvironment.userGenerator.users.find(
      (item: Type.User) => {
        return item.passwordHashed === encryptedPass;
      }
    );

    if (!user) {
      return DefaultType.Void;
    }

    return new CustomString(user.password);
  }
).addArgument('encryptedPass');

export const smtpUserList = CustomFunction.createExternalWithSelf(
  'smtp_user_list',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const ipAddress = args.get('ipAddress');
    const port = args.get('port');

    if (ipAddress instanceof CustomNil || port instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    const ipAddressRaw = ipAddress.toString();

    if (ipAddressRaw === '' || !Utils.isValidIp(ipAddressRaw)) {
      return Promise.resolve(new CustomString('Error: Invalid ip address'));
    }

    // const portRaw = port.toInt();
    // TODO implement smtp user list

    return Promise.resolve(new CustomList());
  }
)
  .addArgument('ipAddress')
  .addArgument('port');

export interface CryptoVariables {
  mockEnvironment: MockEnvironment;
  library: Type.File;
  user: Type.User;
  device: Type.Device;
}

export class Crypto extends BasicInterface {
  static readonly type: string = 'cryptoLib';
  static readonly isa: GreyMap = new GreyMap([
    aireplay,
    airmon,
    aircrack,
    decipher,
    smtpUserList
  ]);

  static retreive(args: Map<string, CustomValue>): Crypto | null {
    const intf = args.get('self');
    if (intf instanceof Crypto) {
      return intf;
    }
    return null;
  }

  variables: CryptoVariables;

  constructor(variables: CryptoVariables) {
    super(Crypto.type, Crypto.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  library: Type.File,
  user: Type.User,
  device: Type.Device
): BasicInterface {
  const itrface = new Crypto({
    mockEnvironment,
    library,
    user,
    device
  });

  return itrface;
}
