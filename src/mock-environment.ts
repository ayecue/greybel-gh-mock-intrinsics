import md5 from 'blueimp-md5';
import randomSeed from 'random-seed';

export interface User {
	username: string;
	password: string;
	passwordHashed: string;
	email: string;
	userBankNumber: string;
}

export enum Service {
	SSH = 'ssh',
	FTP = 'ftp',
	SMTP = 'smtp',
	SQL = 'sql',
	RSHELL = 'rshell',
	HTTP = 'http'
}

export interface Port {
	port: number;
	isClosed: boolean;
	service: Service;
}

export interface NetworkDevice {
	type: string;
	id: string;
	active: boolean;
}

export interface Computer {
	router?: Router;
	localIp: string;
	activeNetCard: string;
	networkDevices: NetworkDevice[];
	users: User[];
	fileSystem: Folder;
	ports?: Port[];
}

export interface Router extends Computer {
	publicIp: string;
}

export interface Network {
	bssid: string;
	essid: string;
	password: string;
	router: Router;
	mac: string;
	percentage: number;
	name: string;
}

export interface RouterNamespace {
	name: string;
	router: Router;
}

export enum FileType {
	Plain,
	Bin,
	Exe,
	Crypto,
	Metaxploit,
	System,
	AptClient,
	Ack,
	Net,
	Init,
	KernelModule
}

export interface FileSystemEntity {
	parent?: FileSystemEntity;
	name: string;
	permissions: string;
	owner: string;
	isFolder?: boolean;
	isProtected?: boolean;
	deleted?: boolean;
}

export interface Folder extends FileSystemEntity {
	files: File[];
	folders: Folder[];
}

export interface File extends FileSystemEntity {
	content?: string;
	type: FileType;
}

export enum Library {
	SSH = 'ssh',
	FTP = 'ftp',
	HTTP = 'http',
	SQL = 'sql',
	SMTP = 'smtp',
	CHAT = 'chat',
	CAM = 'cam',
	RSHELL = 'rshell',
	KERNEL_ROUTER = 'kernel_router',
	APT = 'apt',
	METAXPLOIT = 'metaxploit',
	CRYPTO = 'crypto',
	KERNEL_MODULE = 'kernel_module',
	INIT = 'init',
	NET = 'net'
}

export enum VulnerabilityRequirements {
	LIBRARY,
	REGISTER_AMOUNT,
	ANY_ACTIVE,
	ROOT_ACTIVE,
	LOCAL,
	FORWARD,
	GATEWAY
}

export const VulnerabilityRequirementList = [
	VulnerabilityRequirements.LIBRARY,
	VulnerabilityRequirements.REGISTER_AMOUNT,
	VulnerabilityRequirements.ANY_ACTIVE,
	VulnerabilityRequirements.ROOT_ACTIVE,
	VulnerabilityRequirements.LOCAL,
	VulnerabilityRequirements.FORWARD,
	VulnerabilityRequirements.GATEWAY
];

export enum VulnerabilityAction {
	SHELL,
	FOLDER,
	PASSWORD,
	COMPUTER,
	FIREWALL
}

export const VulnerabilityActionList = [
	VulnerabilityAction.SHELL,
	VulnerabilityAction.FOLDER,
	VulnerabilityAction.PASSWORD,
	VulnerabilityAction.COMPUTER,
	VulnerabilityAction.FIREWALL
];

export enum VulnerabilityActionUser {
	GUEST,
	NORMAL,
	ROOT
}

export interface Vulnerability {
	required: VulnerabilityRequirements[];
	sector: string;
	details: string;
	remote?: boolean;
	library: Library;
	action: VulnerabilityAction;
	user: VulnerabilityActionUser;
	folder: string[];
	memAddress: string;
}

export const vulnerabilityRng = randomSeed.create('test-vul-number');

export function generateVulnerability(library: Library, memAddress: string, remote: boolean): Vulnerability {
	const requirementAmount = vulnerabilityRng.intBetween(0, 3);
	const required: VulnerabilityRequirements[] = [];
	const action = VulnerabilityActionList[vulnerabilityRng.intBetween(0, 4)] as VulnerabilityAction;
	let user;

	while (required.length < requirementAmount) {
		const index = vulnerabilityRng.intBetween(0, 6);
		const req = VulnerabilityRequirementList[index] as VulnerabilityRequirements;

		if (!required.includes(req)) {
			required.push(req);
		}
	}

	const userType = vulnerabilityRng.intBetween(0, 5);

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
		sector: vulnerabilityRng.random().toString(36).substring(2, 12),
		details: 'loop in array',
		remote,
		library,
		action,
		user,
		folder: ['home', 'guest']
	};
}

export function generateSectorVulnerabilities(library: Library, sector: string, remote: boolean): Vulnerability[]  {
	const vulAmount = vulnerabilityRng.intBetween(1, 4);
	const result = [];

	for (let index = vulAmount; index >= 0; index--) {
		result.push(generateVulnerability(library, sector, remote));
	}

	return result;
}

export const vulnerabilities = [
	...generateSectorVulnerabilities(Library.CRYPTO, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.CRYPTO, '0x48096032', false),
	...generateSectorVulnerabilities(Library.FTP, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.FTP, '0x48096032', true),
	...generateSectorVulnerabilities(Library.FTP, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.FTP, '0x48096032', false),
	...generateSectorVulnerabilities(Library.HTTP, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.HTTP, '0x48096032', true),
	...generateSectorVulnerabilities(Library.HTTP, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.HTTP, '0x48096032', false),
	...generateSectorVulnerabilities(Library.INIT, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.INIT, '0x48096032', false),
	...generateSectorVulnerabilities(Library.KERNEL_MODULE, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.KERNEL_MODULE, '0x48096032', false),
	...generateSectorVulnerabilities(Library.KERNEL_ROUTER, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.KERNEL_ROUTER, '0x48096032', true),
	...generateSectorVulnerabilities(Library.METAXPLOIT, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.METAXPLOIT, '0x48096032', false),
	...generateSectorVulnerabilities(Library.NET, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.NET, '0x48096032', false),
	...generateSectorVulnerabilities(Library.RSHELL, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.RSHELL, '0x48096032', true),
	...generateSectorVulnerabilities(Library.RSHELL, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.RSHELL, '0x48096032', false),
	...generateSectorVulnerabilities(Library.SMTP, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.SMTP, '0x48096032', true),
	...generateSectorVulnerabilities(Library.SQL, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.SQL, '0x48096032', true),
	...generateSectorVulnerabilities(Library.SQL, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.SQL, '0x48096032', false),
	...generateSectorVulnerabilities(Library.SSH, '0x33BC9555', true),
	...generateSectorVulnerabilities(Library.SSH, '0x48096032', true),
	...generateSectorVulnerabilities(Library.SSH, '0x33BC9555', false),
	...generateSectorVulnerabilities(Library.SSH, '0x48096032', false)
];

export const userList: User[] = [];

export const bankIdRng = randomSeed.create('test-bank-number');

export function generateUser(username: string, password: string): User {
	const user: User = {
		username,
		password,
		passwordHashed: md5(password),
		email: `${username}@test.org`,
		userBankNumber: bankIdRng.random().toString(36).substring(2, 10)
	};

	userList.push(user);

	return user;
}

function getEtcAptFiles(parent: FileSystemEntity): File[] {
	return [{
		name: 'sources.txt',
		permissions: '-rw-r-----',
		owner: 'root',
		content: `{
			"official_server": true,
			"sourceList": {}
		}`,
		type: FileType.Plain,
		parent
	}];
}

function getEtcAptFolder(parent: FileSystemEntity): Folder {
	const aptFolder: Folder = {
		name: 'apt',
		permissions: 'drwxr-x---',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	aptFolder.files = getEtcAptFiles(aptFolder);

	return aptFolder;
}

function getEtcFiles(parent: FileSystemEntity, users: User[]): File[] {
	return [{
		name: 'passwd',
		permissions: '-rw-r-----',
		owner: 'root',
		content: users.map((v) => `${v.username}:${v.passwordHashed}`).join('\n'),
		type: FileType.Plain,
		parent
	}, {
		name: 'xorg.conf',
		permissions: '-rw-r-----',
		owner: 'root',
		content: ``,
		type: FileType.Plain,
		parent
	}, {
		name: 'fstab',
		permissions: '-rw-r-----',
		owner: 'root',
		content: ``,
		type: FileType.Plain,
		parent
	}];
}

function getEtcFolder(parent: FileSystemEntity, users: User[]): Folder {
	const etcFolder: Folder = {
		name: 'etc',
		permissions: 'drwxr-x---',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	etcFolder.folders = [
		getEtcAptFolder(etcFolder)
	];

	etcFolder.files = getEtcFiles(etcFolder, users);

	return etcFolder;
}

function getLibFiles(parent: FileSystemEntity): File[] {
	return [{
		name: 'init.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.Init,
		parent
	}, {
		name: 'kernel_module.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.KernelModule,
		parent
	}, {
		name: 'net.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.Net,
		parent
	}, {
		name: 'aptclient.so',
		permissions: '-rw-r--r--',
		owner: 'root',
		type: FileType.AptClient,
		parent
	}, {
		name: 'crypto.so',
		permissions: '-rw-r--r--',
		owner: 'root',
		type: FileType.Crypto,
		parent
	}, {
		name: 'metaxploit.so',
		permissions: '-rw-r--r--',
		owner: 'root',
		type: FileType.Metaxploit,
		parent
	}];
}

function getLibFolder(parent: FileSystemEntity): Folder {
	const libFolder: Folder = {
		name: 'lib',
		permissions: 'drwxrwx---',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	libFolder.files = getLibFiles(libFolder);

	return libFolder;
}

function getSysFiles(parent: FileSystemEntity): File[] {
	return [{
		name: 'xorg.sys',
		permissions: '-r-x------',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'config.sys',
		permissions: '-rw-------',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'network.cfg',
		permissions: '-rw-------',
		owner: 'root',
		type: FileType.System,
		parent
	}];
}

function getSysFolder(parent: FileSystemEntity): Folder {
	const sysFolder: Folder = {
		name: 'sys',
		permissions: 'drwxr-xr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	sysFolder.files = getSysFiles(sysFolder);

	return sysFolder;
}

function getDefaultHomeFolders(parent: FileSystemEntity, owner: string, permissions: string): Folder[] {
	return [{
		name: 'Desktop',
		permissions,
		owner,
		isFolder: true,
		folders: [],
		files: [],
		parent
	}, {
		name: 'Downloads',
		permissions,
		owner,
		isFolder: true,
		folders: [],
		files: [],
		parent
	}, {
		name: 'Config',
		permissions,
		owner,
		isFolder: true,
		folders: [],
		files: [],
		parent
	}, {
		name: '.Trash',
		permissions,
		owner,
		isFolder: true,
		folders: [],
		files: [],
		parent
	}];
}

function getRootFolder(parent: FileSystemEntity): Folder {
	const rootFolder: Folder = {
		name: 'root',
		permissions: 'drwxr-----',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	rootFolder.folders = getDefaultHomeFolders(rootFolder, 'root', 'drwxrwx---');

	return rootFolder;
}

export function getUserFolder(parent: FileSystemEntity, user: string): Folder {
	const userFolder: Folder = {
		name: user,
		permissions: 'drwxr-----',
		owner: user,
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	userFolder.folders = getDefaultHomeFolders(userFolder, user, 'drwxrwx---');

	return userFolder;
}

function getGuestFolder(parent: FileSystemEntity): Folder {
	const guestFolder: Folder = {
		name: 'guest',
		permissions: 'drwxrwxrwx',
		owner: 'guest',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	guestFolder.folders = getDefaultHomeFolders(guestFolder, 'guest', 'drwxrwxrwx');

	return guestFolder;
}

function getHomeFolder(parent: FileSystemEntity, users: User[]): Folder {
	const homeFolder: Folder = {
		name: 'home',
		permissions: 'drwxr-xr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	homeFolder.folders = [
		...users.map((v: User) => getUserFolder(homeFolder, v.username)),
		getGuestFolder(homeFolder)
	];

	return homeFolder;
}

function getVarFolder(parent: FileSystemEntity): Folder {
	return {
		name: 'var',
		permissions: 'drwxr-xr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};
}

function getBinFolder(parent: FileSystemEntity): Folder {
	return {
		name: 'bin',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};
}

function getUsrBinFolder(parent: FileSystemEntity): Folder {
	return {
		name: 'bin',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};
}

function getUsrFolder(parent: FileSystemEntity): Folder {
	const usrFolder: Folder = {
		name: 'usr',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	usrFolder.folders = [
		getUsrBinFolder(usrFolder)
	];

	return usrFolder;
}

function getBootFiles(parent: FileSystemEntity): File[] {
	return [{
		name: 'System.map',
		permissions: '-rw-------',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'inittrd.img',
		permissions: '-r--------',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'kernel.img',
		permissions: '-r--------',
		owner: 'root',
		type: FileType.System,
		parent
	}];
}

function getBootFolder(parent: FileSystemEntity): Folder {
	const bootFolder: Folder = {
		name: 'sys',
		permissions: 'drwxr-xr-x',
		owner: 'root',
		isFolder: true,
		folders: [],
		files: [],
		parent
	};

	bootFolder.files = getBootFiles(bootFolder);

	return bootFolder;
}

export function getDefaultFileSystem(users: User[]): Folder {
	const defaultSystem: Folder = {
		name: '',
		permissions: 'drwxr--r--',
		owner: 'root',
		isFolder: true,
		isProtected: true,
		files: [],
		folders: []
	};

	defaultSystem.folders = [
		getEtcFolder(defaultSystem, users),
		getLibFolder(defaultSystem),
		getSysFolder(defaultSystem),
		getRootFolder(defaultSystem),
		getHomeFolder(defaultSystem, users),
		getVarFolder(defaultSystem),
		getBinFolder(defaultSystem),
		getUsrFolder(defaultSystem),
		getBootFolder(defaultSystem)
	];

	return defaultSystem;
}

export function generateComputer(users: User[], rootPassword: string = 'test'): { users: User[], fileSystem: Folder } {
	return {
		users: [generateUser('root', 'test'), ...users],
		fileSystem: getDefaultFileSystem(users)
	};
}

export const networkIdRng = randomSeed.create('test-network-devices');

export function generateNetworkDevice(type: string = 'wlan0'): NetworkDevice {
	return {
		type,
		id: networkIdRng.random().toString(36).substring(2, 10),
		active: true
	};
}

export const routers: Router[] = [{
	publicIp: '142.32.54.56',
	localIp: '192.168.1.1',
	activeNetCard: 'eth0',
	networkDevices: [
		generateNetworkDevice('eth0')
	],
	...generateComputer([], 'nononono')
}, {
	publicIp: '142.567.134.56',
	localIp: '192.168.1.1',
	activeNetCard: 'eth0',
	networkDevices: [
		generateNetworkDevice('eth0')
	],
	...generateComputer([], 'nonononoX2')
}];

export const networks: Network[] = [{
	mac: 'C6:35:EA:25:3A:4C',
	percentage: 70,
	name: 'test-network',
	bssid: 'bssid-test-uuid',
	essid: 'essid-test-uuid',
	password: 'somefoo',
	router: routers[0]
}];

export const homePath: string[] = ['home', 'test'];

export const computers: Computer[] = [
	{
		router: routers[0],
		localIp: '192.168.0.2',
		activeNetCard: 'wlan0',
		networkDevices: [
			generateNetworkDevice()
		],
		...generateComputer([
			generateUser('test', '12345')
		]),
		ports: [{
			port: 22,
			isClosed: false,
			service: Service.SSH
		}]
	},
	{
		router: routers[0],
		localIp: '192.168.0.5',
		activeNetCard: 'wlan0',
		networkDevices: [
			generateNetworkDevice()
		],
		...generateComputer([
			generateUser('Ali', 'shallnotpass')
		], 'helloWorld'),
		ports: [{
			port: 288,
			isClosed: false,
			service: Service.SSH
		}]
	},
	{
		router: routers[1],
		localIp: '192.168.0.1',
		activeNetCard: 'wlan0',
		networkDevices: [
			generateNetworkDevice()
		],
		...generateComputer([
			generateUser('Marvin', '34567')
		], 'superlongpassword123'),
		ports: [{
			port: 22,
			isClosed: false,
			service: Service.SSH
		}, {
			port: 80,
			isClosed: false,
			service: Service.HTTP
		}]
	}
];

export const routerNamespaces: RouterNamespace[] =  [{
	name: 'www.mytest.org',
	router: routers[1]
}];

export function getLocal(): { computer: Computer, user: User, home: string[] } {
	//default setup
	return {
		computer: computers[0],
		user: computers[0].users[1],
		home: homePath
	};
}