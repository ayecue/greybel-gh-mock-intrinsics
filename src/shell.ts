import { CustomMap } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	User,
	Service,
	Computer,
	Port,
	Folder,
	File
} from './types';
import { create as createComputer } from './computer';
import mockEnvironment from './mock/environment';
import {
	getFile,
	getTraversalPath,
	getHomePath,
	getPermissions,
	putFile
} from './utils';

export function create(user: User, computer: Computer, options: { port?: Port, location?: string[] } = {}): BasicInterface {
	const itrface: Map<string, Function> = new Map();
	const activePort = options.port
		? computer.ports.find((item) => item.port === options.port.port)
		: null;
	const currentService = activePort?.service === Service.FTP ? Service.FTP : Service.SSH;
	const currentLocation = options.location || getHomePath(user, computer);

	if (currentService === Service.SSH) {
		itrface.set('connect_service', (
			_: any,
			ip: any,
			port: any,
			user: any,
			password: any,
			service: any
		): BasicInterface | string => {
			const meta = {
				ip: ip?.toString(),
				port: port?.toString(),
				user: port?.toString(),
				password: port?.toString(),
				service: service?.toString()
			};
			let resultPort: Port | null;
			let resultUser: User | null;
			const computers = mockEnvironment.getComputersOfRouterByIp(meta.ip);
			const resultComputer = computers.find((item) => {
				if (item.router.publicIp !== meta.ip) {
					return false;
				}

				for (let portItem of item.ports) {
					if (
						(portItem.service === Service.SSH || portItem.service === Service.FTP) &&
						portItem.port === meta.port
					) {
						resultPort = portItem;
						break;
					}
				}

				if (!resultPort) {
					return false;
				}

				for (let itemUser of item.users) {
					if (itemUser.username === meta.user && itemUser.password === meta.password) {
						resultUser = itemUser;
						break;
					}
				}

				if (!resultUser) {
					return false;
				}

				return false;
			});

			if (resultPort && resultUser) {
				return create(resultUser, resultComputer, {
					port: resultPort
				});
			}

			return 'Invalid connection.';
		});

		itrface.set('scp', (_: any, pathOrig: any, pathDest: any, remoteShell: any): string | boolean => {
			if (remoteShell instanceof CustomMap && remoteShell?.getType() === 'shell') {
				const rshell = remoteShell as BasicInterface;
				const traversalPath = getTraversalPath(pathOrig?.toString(), currentLocation);
				const localFile = getFile(computer.fileSystem, traversalPath);
				const remoteTraversalPath = getTraversalPath(pathDest?.toString(), rshell.value.get('currentLocation'));
				const remoteFile = getFile(rshell.value.get('computer').fileSystem, remoteTraversalPath);

				if (!localFile) {
					return 'pathOrig does not exist.';
				}

				if (!remoteFile) {
					return 'pathDest does not exist.';
				}

				const { r } = getPermissions(user, localFile);

				if (!r) {
					return 'No read permissions for pathOrig.';
				}

				const { w } = getPermissions(rshell.value.get('user'), remoteFile);

				if (!w) {
					return 'No write permissions for pathDest.';
				}

				putFile(remoteFile as Folder, localFile as File);
				return true;
			}

			return 'Invalid remote shell object.'
		});

		itrface.set('build', (_: any, pathSource: any, pathBinary: any, allowImport: any): string => {
			return 'Not yet supported.';
		});

		itrface.set('launch', (_: any, path: any, args: any): string => {
			return 'Not yet supported.';
		});

		itrface.set('ping', (_: any, ipAddress: any): boolean | null => {
			const ip = ipAddress?.toString();
			const router = mockEnvironment.getRouterByIp(ip);

			if (router) {
				return true;
			}

			return null;
		});

		itrface.set('masterkey', (_: any): null => {
			return null;
		});

		itrface.set('masterkey_direct', (_: any): null => {
			return null;
		});

		itrface.set('restore_network', (_: any): null => {
			return null;
		});
	} else if (currentService === Service.FTP) {
		itrface.set('put', (_: any): string => {
			return 'Not yet supported.';
		});
	}

	itrface.set('start_terminal', (_: any): null => {
		return null;
	});

	itrface.set('host_computer', (_: any): BasicInterface => {
		return createComputer(user, computer, { location: currentLocation });
	});


	return new BasicInterface(
		Service.SSH === currentService ? 'shell' : 'ftpShell',
		itrface,
		new Map<string, any>([
			['user', user],
			['computer', computer],
			['currentLocation', currentLocation]
		])
	);
}

export function loginLocal(user: any, password: any): BasicInterface | null {
	const computer = mockEnvironment.getLocal().computer;

	const usr = user?.toString();
	const pwd = password?.toString();

	if (!usr && !pwd) {
		return create(mockEnvironment.getLocal().user, computer);
	}

	for (user of computer.users) {
		if (
			user.username === usr && 
			user.password === pwd
		) {
			return create(user, computer);
		}
	}

	return null;
}