import { MockEnvironment, Type, Utils } from 'greybel-mock-environment';

function createDefaultEnvironment(): MockEnvironment {
  const mockEnvironment = new MockEnvironment('test', {
    username: 'test',
    password: 'test'
  });
  const userGenerator = mockEnvironment.userGenerator;
  const emailGenerator = mockEnvironment.emailGenerator;
  const networkGenerator = mockEnvironment.networkGenerator;

  mockEnvironment.setupLibraries();

  const localSession = mockEnvironment.localSession;
  const localLocation = localSession.computer.location.fork();
  const localRouter = networkGenerator.generateRouter({
    publicIp: '142.32.54.56',
    location: localLocation
  });

  for (let index = 0; index < 4; index++) {
    const offsetX = Utils.getRandom(-5, 5);
    const offsetY = Utils.getRandom(-5, 5);

    networkGenerator.generateRouter({
      location: localLocation.offset(offsetX, offsetY)
    });
  }

  localRouter.bssid = 'bssid-test-uuid';
  localRouter.essid = 'essid-test-uuid';
  localRouter.wifi.credentials.password = 'test';

  mockEnvironment.connectLocal(localRouter);
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

  computer.addPort(sshTestPort);

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
