import { CustomBoolean, CustomMap } from 'greybel-interpreter';
import BasicInterface from './interface';
import { Router, User, Port, Computer, Network } from './types';
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

	itrface.set('bssid_name', (_: any): string => {
		return mockEnvironment.networks
			.find((v: Network) => v.router.publicIp === router.publicIp)
			?.bssid;
	});

	itrface.set('essid_name', (_: any): string => {
		return mockEnvironment.networks
			.find((v: Network) => v.router.publicIp === router.publicIp)
			?.essid;
	});

	itrface.set('computers_lan_ip', (_: any): string[] => {
		return mockEnvironment.getComputersOfRouter(router)
			.map((item: Computer) => item.localIp);
	});

	itrface.set('used_ports', (_: any): BasicInterface[] => {
		return mockEnvironment.getForwardedPortsOfRouter(router)
			.map((item: Port) => createPort(router, item)) || [];
	});

	itrface.set('device_ports', (_: any, ipAddress: any): BasicInterface[] => {
		const device = mockEnvironment.getComputerInLan(ipAddress?.toString(), router);

		if (!device) {
			return [];
		}

		return device.ports.map((item: Port) => createPort(device, item))
	});

	itrface.set('ping_port', (_: any, port: any): BasicInterface => {
		const meta = {
			port: Number(port?.valueOf())
		};
		const computers = mockEnvironment.getComputersOfRouterByIp(router.publicIp);

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
			return `${port.value.get('port')} ${port.value.get('isClosed')} ${port.value.get('forwarded')} ${port.value.get('service')}`
		}

		return null;
	});

	return new BasicInterface('router', itrface);
}