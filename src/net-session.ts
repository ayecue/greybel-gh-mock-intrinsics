import BasicInterface from './interface';
import {
	Computer,
	Library
} from './types';
import { create as createMetaLib } from './meta-lib';

export function create(computer: Computer, targetComputer: Computer, library: Library): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('dump_lib', (_: any): BasicInterface => {
		return createMetaLib(computer, targetComputer, library);
	});

	return new BasicInterface('netSession', itrface);
}