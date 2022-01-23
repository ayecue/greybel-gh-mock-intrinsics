import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	User,
	Service,
	computers,
	routers,
	Computer,
	Port,
	getLocal
} from './mock-environment';
import { create as createComputer } from './computer';

export function create(user: User, computer: Computer, port?: Port): BasicInterface {
	const itrface: Map<string, Function> = new Map();
	const activePort = port
		? computer.ports.find((item) => item.port === port.port)
		: null;
	const currentService = activePort?.service === Service.FTP ? Service.FTP : Service.SSH;

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
				ip: ip.toString(),
				port: port.toString(),
				user: port.toString(),
				password: port.toString(),
				service: service.toString()
			};
			let resultPort: Port | null;
			let resultUser: User | null;
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
				return create(resultUser, resultComputer, resultPort);
			}

			return 'Invalid connection.';
		});

		itrface.set('scp', (_: any, pathOrig: any, pathDest: any, remoteShell: any): string => {
			return 'Not yet supported.';
		});

		itrface.set('build', (_: any, pathSource: any, pathBinary: any, allowImport: any): string => {
			return 'Not yet supported.';
		});

		itrface.set('launch', (_: any, path: any, args: any): string => {
			return 'Not yet supported.';
		});

		itrface.set('ping', (_: any, ipAddress: any): boolean | null => {
			const ip = ipAddress.toString();
			const router = routers.find((item) => item.publicIp === ip);

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
		return createComputer(user, computer);
	});


	return new BasicInterface(
		Service.SSH === currentService ? 'Shell' : 'FtpShell',
		itrface
	);
}

export function loginLocal(user: any, password: any): BasicInterface | null {
	const computer = getLocal().computer;

	const usr = user?.toString();
	const pwd = password?.toString();

	if (!usr && !pwd) {
		return create(getLocal().user, computer);
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