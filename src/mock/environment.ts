import { CustomMap, CustomString, ObjectValue } from 'greybel-interpreter';
import {
  MockEnvironment,
  MockEnvironmentOptions,
  Type,
  Utils
} from 'greybel-mock-environment';
import { Interpreter } from 'greyscript-interpreter';

export class GHMockIntrinsicEnv extends MockEnvironment {
  private startTime: number;
  private launchCallStack: number = 0;
  private sharedCustomObject: CustomMap;

  constructor(options: MockEnvironmentOptions) {
    super(options);
    this.startTime = Date.now();
    this.sharedCustomObject = new CustomMap(
      new ObjectValue([
        [new CustomString('classID'), new CustomString('custom_object')]
      ])
    );
  }

  getLaunchCallStack(): number {
    return this.launchCallStack;
  }

  increaseLaunchCallStack(): GHMockIntrinsicEnv {
    this.launchCallStack++;
    return this;
  }

  decreaseLaunchCallStack(): GHMockIntrinsicEnv {
    this.launchCallStack--;
    return this;
  }

  getSharedCustomObject(): CustomMap {
    return this.sharedCustomObject;
  }
}

export function createGHMockEnv(
  interpreter: Interpreter,
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

  const testRemoteRouter = networkGenerator.generateRouter({
    publicIp: '172.57.134.56',
    domain: 'www.mytest.org',
    users: [
      userGenerator.generate('root', 'test'),
      userGenerator.generate('gandalf', 'shallnotpass')
    ]
  });
  
  testRemoteRouter.getForwarded(22)?.removePort(22);

  const testRemoteDevice = testRemoteRouter.getComputers()[0];
  const remoteSshTestPort = new Type.Port({
    port: 22,
    service: Type.ServiceType.SSH,
    isClosed: false
  });

  testRemoteDevice.changePassword('root', 'test');
  testRemoteDevice.addPort(remoteSshTestPort);

  const sshTestPort = new Type.Port({
    port: 22,
    service: Type.ServiceType.SSH,
    isClosed: false
  });
  const { device, user, programPath } = mockEnvironment.getLocal();

  device.addProcess({
    owner: user,
    command: programPath.name,
    ref: interpreter
  });
  (device.getRouter() as Type.Router).getForwarded(22)?.removePort(22);
  device.addPort(sshTestPort);

  emailGenerator.generate({
    name: 'test',
    domain: 'test.org',
    password: 'test'
  });

  return mockEnvironment;
}
