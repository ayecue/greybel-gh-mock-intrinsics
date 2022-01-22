import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { User, Computer } from './mock-environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();


	return new BasicInterface('MetaMail', itrface);
}