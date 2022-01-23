import { CustomBoolean, CustomMap } from 'greybel-interpreter';
import BasicInterface from './interface';
import { Router, User, computers, Port } from './mock-environment';
import { create as createPort } from './port';

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

	itrface.set('port_info', (_: any, portObject: any): string | null => {
		if (portObject instanceof CustomMap) {
			const port = portObject as BasicInterface;
			return `${port.value.get('port')} ${port.value.get('isClosed')} ${port.value.get('service')}`
		}

		return null;
	});

	return new BasicInterface('Router', itrface);
}