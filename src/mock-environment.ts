import { md5, xmur3 } from './utils';

export interface User {
	username: string;
	password: string;
	passwordHashed: string;
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

export enum FileType {
	Plain,
	Bin,
	Exe,
	Crypto,
	Metaxploit,
	System,
	AptClient
}

export interface FileSystemEntity {
	parent?: FileSystemEntity;
	name: string;
	permissions: string;
	owner: string;
	isFolder?: boolean;
	isProtected?: boolean;
}

export interface Folder extends FileSystemEntity {
	files?: File[];
	folders?: Folder[];
}

export interface File extends FileSystemEntity {
	content?: string;
	type: FileType;
}

export function generateUser(username: string, password: string): User {
	return {
		username,
		password,
		passwordHashed: md5(password)
	};
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
		type: FileType.System,
		parent
	}, {
		name: 'kernel_module.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'net.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.System,
		parent
	}, {
		name: 'aptclient.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.AptClient,
		parent
	}, {
		name: 'crypto.so',
		permissions: '-rw-r-----',
		owner: 'root',
		type: FileType.Crypto,
		parent
	}, {
		name: 'metaxploit.so',
		permissions: '-rw-r-----',
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
		parent
	}, {
		name: 'Downloads',
		permissions,
		owner,
		isFolder: true,
		parent
	}, {
		name: 'Config',
		permissions,
		owner,
		isFolder: true,
		parent
	}, {
		name: '.Trash',
		permissions,
		owner,
		isFolder: true,
		parent
	}];
}

function getRootFolder(parent: FileSystemEntity): Folder {
	const rootFolder: Folder = {
		name: 'root',
		permissions: 'drwxr-----',
		owner: 'root',
		isFolder: true,
		parent
	};

	rootFolder.folders = getDefaultHomeFolders(rootFolder, 'root', 'drwxrwx---');

	return rootFolder;
}

export function getUserFolder(parent: FileSystemEntity, user: string): Folder {
	const userFolder: Folder = {
		name: 'root',
		permissions: 'drwxr-----',
		owner: 'root',
		isFolder: true,
		parent
	};

	userFolder.folders = getDefaultHomeFolders(userFolder, user, 'drwxrwx---');

	return userFolder;
}

function getGuestFolder(parent: FileSystemEntity): Folder {
	const guestFolder: Folder = {
		name: 'root',
		permissions: 'drwxrwxrwx',
		owner: 'root',
		isFolder: true,
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
		parent
	};
}

function getBinFolder(parent: FileSystemEntity): Folder {
	return {
		name: 'bin',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
		parent
	};
}

function getUsrBinFolder(parent: FileSystemEntity): Folder {
	return {
		name: 'bin',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
		parent
	};
}

function getUsrFolder(parent: FileSystemEntity): Folder {
	const usrFolder: Folder = {
		name: 'usr',
		permissions: 'drwxrwxr-x',
		owner: 'root',
		isFolder: true,
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
		files: []
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

export const networkIdRng = xmur3('test-network-devices');

export function generateNetworkDevice(type: string = 'wlan0'): NetworkDevice {
	return {
		type,
		id: networkIdRng().toString(36).substring(2, 10),
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
			port: 22,
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
		}]
	}
];