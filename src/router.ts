import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { Router, User } from './mock-environment';

export function create(user: User, router: Router): BasicInterface {
	const itrface: Map<string, Function> = new Map();


	return new BasicInterface('Router', itrface);
}