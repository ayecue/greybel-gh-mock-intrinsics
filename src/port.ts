import BasicInterface from './interface';
import { Port, Computer } from './mock-environment';

export function create(computer: Computer, port: Port): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('get_lan_ip', (): string => {
		return computer.localIp;
	});

    itrface.set('is_closed', (): boolean => {
		return port.isClosed;
	});

    itrface.set('port_number', (): number => {
		return port.port;
	});

	return new BasicInterface('Port', itrface);
}