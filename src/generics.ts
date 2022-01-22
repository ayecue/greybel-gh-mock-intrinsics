import {
	CustomBoolean,
	CustomNumber,
	CustomString,
	CustomNil,
	CustomMap,
	CustomList
} from 'greybel-interpreter';
import { md5 as actualMd5 } from './utils';

export function md5(customValue: any): string | null {
	if (customValue instanceof CustomString) {
		return actualMd5(customValue.toString());
	}
	return null;
}

export function get_shell(user: any, password: any) {
	
}