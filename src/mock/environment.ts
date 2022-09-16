import { MockEnvironment, Type } from 'greybel-mock-environment';

function createDefaultEnvironment(): MockEnvironment {
  const mockEnvironment = new MockEnvironment('test', {
    username: 'test',
    password: 'test'
  });

  mockEnvironment.setupLibraries();

  const localRouters = [
    mockEnvironment.generateRouter({
      publicIp: '142.32.54.56'
    }),
    mockEnvironment.generateRouter(),
    mockEnvironment.generateRouter(),
    mockEnvironment.generateRouter()
  ];

  localRouters.forEach((v) => mockEnvironment.generateNetwork(v));
  mockEnvironment.networks[0].bssid = 'bssid-test-uuid';
  mockEnvironment.networks[0].essid = 'essid-test-uuid';
  mockEnvironment.networks[0].password = 'test';
  mockEnvironment.connectLocal(localRouters[0]);
  mockEnvironment.generateRouter({
    publicIp: '142.567.134.56',
    domain: 'www.mytest.org',
    users: [
      mockEnvironment.generateUser('root', 'test'),
      mockEnvironment.generateUser('gandalf', 'shallnotpass')
    ]
  });
  mockEnvironment.getLocal().computer.ports.push({
    port: 22,
    service: Type.Service.SSH,
    isClosed: false,
    forwarded: true
  });
  mockEnvironment.generateEmail({
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
