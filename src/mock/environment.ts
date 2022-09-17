import { MockEnvironment, Type } from 'greybel-mock-environment';

function createDefaultEnvironment(): MockEnvironment {
  const mockEnvironment = new MockEnvironment('test', {
    username: 'test',
    password: 'test'
  });
  const userGenerator = mockEnvironment.userGenerator;
  const emailGenerator = mockEnvironment.emailGenerator;
  const networkGenerator = mockEnvironment.networkGenerator;

  mockEnvironment.setupLibraries();

  const localRouters = [
    networkGenerator.generateRouter({
      publicIp: '142.32.54.56'
    }),
    networkGenerator.generateRouter(),
    networkGenerator.generateRouter(),
    networkGenerator.generateRouter()
  ];

  localRouters.forEach((v) => networkGenerator.generateWifiNetwork(v));
  networkGenerator.wifiNetworks[0].router.bssid = 'bssid-test-uuid';
  networkGenerator.wifiNetworks[0].router.essid = 'essid-test-uuid';
  networkGenerator.wifiNetworks[0].password = 'test';
  mockEnvironment.connectLocal(localRouters[0]);
  networkGenerator.generateRouter({
    publicIp: '142.567.134.56',
    domain: 'www.mytest.org',
    users: [
      userGenerator.generate('root', 'test'),
      userGenerator.generate('gandalf', 'shallnotpass')
    ]
  });

  const sshTestPort = new Type.Port({
    port: 22,
    service: Type.Service.SSH,
    isClosed: false,
    forwarded: true
  });

  const { computer } = mockEnvironment.getLocal();

  computer.ports.set(sshTestPort.port, sshTestPort);
  computer.router.ports.set(sshTestPort.port, sshTestPort);

  emailGenerator.generate({
    name: 'test',
    domain: 'test.org',
    password: 'test'
  });

  return mockEnvironment;
}

export class Env {
  private instance: MockEnvironment;

  constructor() {
    this.instance = createDefaultEnvironment();
  }

  get(): MockEnvironment {
    return this.instance;
  }

  set(instance: MockEnvironment): Env {
    this.instance = instance;
    return this;
  }
}

export default new Env();
