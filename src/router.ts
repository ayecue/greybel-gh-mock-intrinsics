import { CustomBoolean, CustomMap } from 'greybel-interpreter';
import BasicInterface from './interface';
import { Router, User, Port } from './types';
import { create as createPort } from './port';
import mockEnvironment from './mock/environment';

export function create(user: User, router: Router): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('public_ip', (_: any): string => {
		return router.publicIp;
	});

	itrface.set('local_ip', (_: any): string => {
		return router.localIp;
	});

	itrface.set('ping_port', (_: any, port: any): BasicInterface => {
		const meta = {
			port: Number(port?.valueOf())
		};
		const computers = mockEnvironment.getComputersOfRouter(router.publicIp);

		for (let item of computers) {
			if (item.router.publicIp === router.publicIp) {
				continue;
			}

			for (let itemPort of item.ports) {
				if (itemPort.port === meta.port) {
					return createPort(router, itemPort);
				}
			}
		}

		return null;
	});

	itrface.set('used_ports', (_: any): BasicInterface[] => {
		const result = [];
		const computers = mockEnvironment.getComputersOfRouter(router.publicIp);

		for (let item of computers) {
			if (item.router.publicIp === router.publicIp) {
				continue;
			}

			result.push(...item.ports.map((itemPort: Port) => {
				return createPort(router, itemPort);
			}));
		}

		return result;
	});

	itrface.set('port_info', (_: any, portObject: any): string | null => {
		if (portObject instanceof CustomMap) {
			const port = portObject as BasicInterface;
			return `${port.value.get('port')} ${port.value.get('isClosed')} ${port.value.get('service')}`
		}

		return null;
	});

	return new BasicInterface('router', itrface);
}