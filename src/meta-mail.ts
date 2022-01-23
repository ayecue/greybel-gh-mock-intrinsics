import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { User, Computer } from './mock-environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('fetch', (_: any): string[] => {
		return [];
	});

    itrface.set('read', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('send', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('delete', (_: any): string => {
		return 'Not yet supported';
	});

	return new BasicInterface('MetaMail', itrface);
}