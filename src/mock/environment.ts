import { CustomMap, CustomString, ObjectValue } from 'greybel-interpreter';
import {
  MockEnvironment,
  MockEnvironmentOptions,
  Type,
  Utils
} from 'greybel-mock-environment';

export const sharedCustomObject = new CustomMap(
  new ObjectValue(
    new Map([[new CustomString('classID'), new CustomString('custom_object')]])
  )
);

export class GHMockIntrinsicEnv extends MockEnvironment {
  private startTime: number;
  private launchCallStack: number = 0;

  constructor(options: MockEnvironmentOptions) {
    super(options);
    this.startTime = Date.now();
  }

  getLaunchCallStack(): number {
    return this.launchCallStack;
  }

  increaseLaunchCallStack(): GHMockIntrinsicEnv {
    this.launchCallStack++;
    return this;
  }

  decreaseLaunchCallStack(): GHMockIntrinsicEnv {
    this.launchCallStack;
    return this;
  }

  getSharedCustomObject(): CustomMap {
    return sharedCustomObject;
  }

  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}

export function createGHMockEnv(
  options: MockEnvironmentOptions = {}
): GHMockIntrinsicEnv {
  const mockEnvironment = new GHMockIntrinsicEnv(options);
  const userGenerator = mockEnvironment.userGenerator;
  const emailGenerator = mockEnvironment.emailGenerator;
  const networkGenerator = mockEnvironment.networkGenerator;

  const localSession = mockEnvironment.localSession;
  const localLocation = localSession.device.location.fork();
  const localRouter = networkGenerator.generateRouter({
    publicIp: '142.32.54.56',
    localIp: '192.168.0.1',
    location: localLocation
  });
  const closeRouters = [];

  for (let index = 0; index < 4; index++) {
    const offsetX = Utils.getRandom(-5, 5);
    const offsetY = Utils.getRandom(-5, 5);
    const router = networkGenerator.generateRouter({
      location: localLocation.offset(offsetX, offsetY)
    });

    closeRouters.push(router);
  }

  closeRouters[0].mac = 'bssid-test-uuid';
  closeRouters[0].wifi.name = 'essid-test-uuid';
  closeRouters[0].wifi.credentials.password = 'test';

  mockEnvironment.connectLocal(localRouter);
  networkGenerator.generateRouter({
    publicIp: '172.57.134.56',
    domain: 'www.mytest.org',
    users: [
      userGenerator.generate('root', 'test'),
      userGenerator.generate('gandalf', 'shallnotpass')
    ]
  });

  const sshTestPort = new Type.Port({
    port: 22,
    service: Type.ServiceType.SSH,
    isClosed: false
  });
  const { device } = mockEnvironment.getLocal();

  device.addPort(sshTestPort);

  emailGenerator.generate({
    name: 'test',
    domain: 'test.org',
    password: 'test'
  });

  return mockEnvironment;
}
