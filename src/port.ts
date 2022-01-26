import BasicInterface from './interface';
import { Computer, Port } from './types';

export function create(computer: Computer, port: Port): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('get_lan_ip', (_: any): string => {
		return computer.localIp;
	});

    itrface.set('is_closed', (_: any): boolean => {
		return port.isClosed;
	});

    itrface.set('port_number', (_: any): number => {
		return port.port;
	});

	return new BasicInterface('port', itrface, new Map<string, any>([
		['port', port.port],
		['isClosed', port.isClosed],
		['service', port.service],
		['forwarded', port.forwarded]
	]));
}