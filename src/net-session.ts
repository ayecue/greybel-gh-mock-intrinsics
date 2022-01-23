import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { Library, Computer } from './mock-environment';
import { create as createMetaLib } from './meta-lib';

export function create(computer: Computer, targetComputer: Computer, library: Library): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('dump_lib', (_: any): BasicInterface => {
		return createMetaLib(computer, targetComputer, library);
	});

	return new BasicInterface('NetSession', itrface);
}