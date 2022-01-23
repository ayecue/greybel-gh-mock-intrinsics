import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { User, Computer } from './mock-environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

    itrface.set('show', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('search', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('update', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('add_repo', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('del_repo', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('install', (_: any): string => {
		return 'Not yet supported';
	});

    itrface.set('check_upgrade', (_: any): string => {
		return 'Not yet supported';
	});

	return new BasicInterface('AptClient', itrface);
}