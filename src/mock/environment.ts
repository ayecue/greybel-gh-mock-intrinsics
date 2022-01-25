import md5 from 'blueimp-md5';
const randomUsernameGenerator = require('random-username-generator');
import generatePassword from 'generate-password-browser';
import randomSeed, { RandomSeed } from 'random-seed';
import {
	User,
	Computer,
	NetworkDevice,
	Router,
	Network,
	Service,
	Library,
	VulnerabilityRequirements,
	VulnerabilityRequirementList,
	VulnerabilityAction,
	VulnerabilityActionList,
	VulnerabilityActionUser,
	Vulnerability,
	Port,
	ServiceList,
	EMail
} from '../types';
import getDefaultFileSystem from './default-file-system';

export class MockEnvironment {
	seed: string;

	vulnerabilityRng: RandomSeed;
	bankIdRng: RandomSeed;
	networkRng: RandomSeed;
	macAddressRng: RandomSeed;
	uuidRng: RandomSeed;
	passwordRng: RandomSeed;
	usernameRng: RandomSeed;
	portRng: RandomSeed;

	users: User[];
	routers: Router[];
	computers: Computer[];
	vulnerabilities: Vulnerability[];
	networks: Network[];
	emails: EMail[];

	localComputer: Computer;

	constructor(seed: string = 'test', localUser: { username: string, password: string }) {
		this.seed = seed;
		this.vulnerabilityRng = randomSeed.create(`${seed}-vul-number`);
		this.bankIdRng = randomSeed.create(`${seed}-bank-number`);
		this.networkRng = randomSeed.create(`${seed}-network-devices`);
		this.macAddressRng = randomSeed.create(`${seed}-mac-address`);
		this.uuidRng = randomSeed.create(`${seed}-uuid`);
		this.passwordRng = randomSeed.create(`${seed}-password`);
		this.usernameRng = randomSeed.create(`${seed}-username`);
		this.portRng = randomSeed.create(`${seed}-port`);
		this.users = [];
		this.routers = [];
		this.computers = [];
		this.vulnerabilities = [];
		this.networks = [];
		this.emails = [];
		this.localComputer = this.generateComputer(null, [
			this.generateUser(localUser.username, localUser.password)
		], 'test');
	}

	generateUser(username: string, password: string): User {
		const me = this;
		const user: User = {
			username,
			password,
			passwordHashed: md5(password),
			email: me.generateEmail({
				name: username,
				password: password
			}),
			userBankNumber: me.bankIdRng.random().toString(36).substring(2, 10)
		};
	
		me.users.push(user);
	
		return user;
	}

	generateDomain(): string {
		const me = this;
		return `${me.generateUsername()}.${['org','com','de','tv'][me.networkRng.intBetween(0, 3)]}`;
	}

	generateEmail(options: { name?: string, domain?: string, password?: string }): string {
		const me = this;
		const email = `${options.name || me.generateUsername()}@${options.domain || me.generateDomain()}`;
		me.emails.push({
			email,
			password: options.password || me.generatePassword(),
			messages: new Map()
		});
		return email;
	}

	generateRouter(options: Partial<Router> = {}): Router {
		const me = this;
		const networkDevice = me.generateNetworkDevice();
		const routerUsers = [
			me.generateUser('root', me.generatePassword()),
			me.generateUser(me.generateUsername(), me.generatePassword())
		];
		const domain = me.generateDomain();
		const name = me.generateUsername();
		const router = {
			domain: options.domain || `www.${domain}`,
			whoisDescription: options.whoisDescription || [
				`Domain name: ${domain}`,
				`Administrative contact: ${name}`,
				`Email address: ${me.generateEmail({ name, domain })}`,
				'Phone: 123456891'
			].join('\n'),
			publicIp: options.publicIp || me.generateIp(),
			localIp: options.localIp || me.generateLocalIp(),
			activeNetCard: options.activeNetCard || networkDevice.type,
			networkDevices: options.networkDevices || [
				networkDevice
			],
			users: options.users || routerUsers,
			fileSystem: options.fileSystem || getDefaultFileSystem(routerUsers),
		};

		for (let index = me.networkRng.intBetween(4, 10); index >= 0; index--) {
			me.generateComputer(router, [
				me.generateUser(me.generateUsername(), me.generatePassword())
			]);
		}

		me.routers.push(router);

		return router;
	}

	generateComputer(router: Router | null, users: User[], rootPassword?: string): Computer {
		const me = this;
		const networkDevice = me.generateNetworkDevice();
		const computerUsers = [
			me.generateUser('root', rootPassword || me.generatePassword()),
			...users
		];
		const computer = {
			router,
			localIp: me.generateLocalIp(),
			activeNetCard: networkDevice.type,
			networkDevices: [
				networkDevice
			],
			users: computerUsers,
			fileSystem: getDefaultFileSystem(computerUsers),
			ports: me.generatePorts()
		};

		me.computers.push(computer);
		
		return computer;
	}

	generatePorts(): Port[] {
		const me = this;
		return [...Array(me.portRng.intBetween(1, 3)).keys()].map(() => {
			return {
				port: me.portRng.intBetween(1, 1000),
				isClosed: !!me.portRng.intBetween(0, 1),
				service: ServiceList[me.portRng.intBetween(0, 5)]
			};
		});
	}

	generateNetworkDevice(): NetworkDevice {
		return {
			type: this.networkRng.intBetween(0, 1) === 0 ? 'wlan0' : 'eth0',
			id: this.networkRng.random().toString(36).substring(2, 10),
			active: true
		};
	}

	generateIp(): string {
		const me = this;
		return `${me.networkRng.intBetween(0, 255)}.${me.networkRng.intBetween(0, 255)}.${me.networkRng.intBetween(0, 255)}.${me.networkRng.intBetween(0, 255)}`
	}

	generateLocalIp(): string {
		const me = this;
		return `192.168.${me.networkRng.intBetween(0, 255)}.${me.networkRng.intBetween(0, 255)}`
	}

	generateMAC(): string {
		const me = this;
		const d = '0123456789ABCDEF';
		return [...Array(6).keys()].map(() => {
			return d[me.macAddressRng.intBetween(0, 15)] + d[me.macAddressRng.intBetween(0, 15)];
		}).join(':');
	}

	generateUUID(): string {
		const me = this;
		let dt = me.uuidRng.random();
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = (dt + me.uuidRng.random()*16)%16 | 0;
			dt = Math.floor(dt/16);
			return (c=='x' ? r :(r&0x3|0x8)).toString(16);
		});
	}

	generateUsername(): string {
		const me = this;
		const nativeMath = Math.random;
		Math.random = () => me.usernameRng.random();
		const username = randomUsernameGenerator.generate();
		Math.random = nativeMath;
		return username;
	}

	generatePassword(): string {
		const me = this;
		const nativeMath = Math.random;
		Math.random = () => me.passwordRng.random();
		const password = generatePassword.generate({
			length: me.passwordRng.intBetween(4, 8)
		});
		Math.random = nativeMath;
		return password;
	}

	generateNetwork(router: Router, options: Partial<Network> = {}): Network {
		const me = this;
		const network = {
			mac: options.mac || me.generateMAC(),
			percentage: options.percentage || me.networkRng.intBetween(20, 70),
			name: options.name || me.generateUsername(),
			bssid: options.bssid || me.generateUUID(),
			essid: options.essid || me.generateUUID(),
			password: options.password || me.generatePassword(),
			router
		};

		me.networks.push(network);

		return network;
	}

	generateVulnerabilityAddress(): string {
		const me = this;
		const d = '0123456789ABCDEF';
		return '0x' + [...Array(8).keys()].map(() => {
			return d[me.vulnerabilityRng.intBetween(0, 15)];
		}).join('');
	}

	generateVulnerability(library: Library, memAddress: string, remote: boolean): Vulnerability {
		const me = this;
		const requirementAmount = me.vulnerabilityRng.intBetween(0, 3);
		const required: VulnerabilityRequirements[] = [];
		const action = VulnerabilityActionList[me.vulnerabilityRng.intBetween(0, 4)] as VulnerabilityAction;
		let user;
	
		while (required.length < requirementAmount) {
			const index = me.vulnerabilityRng.intBetween(0, 6);
			const req = VulnerabilityRequirementList[index] as VulnerabilityRequirements;
	
			if (!required.includes(req)) {
				required.push(req);
			}
		}
	
		const userType = me.vulnerabilityRng.intBetween(0, 5);
	
		switch (userType) {
			case 0:
				user = VulnerabilityActionUser.ROOT;
				break;
			case 1:
			case 2:
				user = VulnerabilityActionUser.NORMAL;
				break;
			default:
				user = VulnerabilityActionUser.GUEST;
				break;
		}
	
		return {
			required,
			memAddress,
			sector: me.vulnerabilityRng.random().toString(36).substring(2, 12),
			details: 'loop in array',
			remote,
			library,
			action,
			user,
			folder: ['home', 'guest']
		};
	}

	generateSectorVulnerabilities(library: Library, sector: string, remote: boolean): Vulnerability[]  {
		const me = this;
		const vulAmount = me.vulnerabilityRng.intBetween(1, 4);
		const result = [];
	
		for (let index = vulAmount; index >= 0; index--) {
			result.push(me.generateVulnerability(library, sector, remote));
		}

		this.vulnerabilities.push(...result);
	
		return result;
	}

	generateVulnerabilitiesForLibrary(library: Library, options: { remote?: boolean; local?: boolean; } = {}) {
		const me = this;
		let address = me.generateVulnerabilityAddress();

		for (let amount = me.vulnerabilityRng.intBetween(2, 5); amount >= 0; amount--) {
			if (options.remote) me.generateSectorVulnerabilities(library, address, true);
			if (options.local) me.generateSectorVulnerabilities(library, address, false);

			address = me.vulnerabilityRng.intBetween(0, 3) === 1 ? me.generateVulnerabilityAddress() : address;
		}
	}

	setupLibraries() {
		const me = this;
		me.generateVulnerabilitiesForLibrary(Library.CRYPTO, { local: true });
		me.generateVulnerabilitiesForLibrary(Library.FTP, { local: true, remote: true });
		me.generateVulnerabilitiesForLibrary(Library.HTTP, { local: true, remote: true });
		me.generateVulnerabilitiesForLibrary(Library.INIT, { local: true });
		me.generateVulnerabilitiesForLibrary(Library.KERNEL_MODULE, { local: true });
		me.generateVulnerabilitiesForLibrary(Library.KERNEL_ROUTER, { remote: true });
		me.generateVulnerabilitiesForLibrary(Library.METAXPLOIT, { local: true });
		me.generateVulnerabilitiesForLibrary(Library.NET, { local: true });
		me.generateVulnerabilitiesForLibrary(Library.RSHELL, { local: true, remote: true });
		me.generateVulnerabilitiesForLibrary(Library.SMTP, { local: true, remote: true });
		me.generateVulnerabilitiesForLibrary(Library.SQL, { local: true, remote: true });
		me.generateVulnerabilitiesForLibrary(Library.SSH, { local: true, remote: true });
	}

	getLocal(): { computer: Computer, user: User, home: string[] } {
		const computer = this.localComputer;
		const user = computer.users[1];

		return {
			computer,
			user,
			home: ['home', user.username]
		};
	}

	connectLocal(router: Router) {
		this.localComputer.router = router;
	}

	getRouter(ipAddress: string): Router | null {
		const me = this;

		if (!me.isValidIp(ipAddress)) {
			return null;
		}

		return me.routers.find((item: Router) => {
			return item.publicIp === ipAddress;
		}) || me.generateRouter({
			publicIp: ipAddress
		});
	}

	getComputersOfRouter(ipAddress: string): Computer[] {
		const me = this;
		const router = me.getRouter(ipAddress);

		if (!router) {
			return [];
		}

		return me.computers.filter((v) => {
			return v.router.publicIp === router.publicIp;
		});
	}

	findRouterViaNS(name: string): Router {
		const me = this;

		return me.routers.find((item: Router) => {
			return item.domain === name;
		});
	}

	getEmailViaLogin(email: string, password: string): EMail | null {
		const me = this;
		return me.emails.find((v) => v.email === email && v.password === password);
	}

	getEmail(email: string): EMail | null {
		const me = this;
		return me.emails.find((v) => v.email === email);
	}

	isValidIp(target: string): boolean {
		return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(target);
	}
	
	isLanIp(target: string): boolean {
		return /^1(0|27|69\.254|72\.(1[6-9]|2[0-9]|3[0-1])|92\.168)\./.test(target);
	}
}

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
	service: Service.SSH,
	isClosed: false
});
mockEnvironment.generateEmail({
	name: 'test',
	domain: 'test.org',
	password: 'test'
});

export default mockEnvironment;