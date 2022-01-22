import {
	CustomBoolean,
	CustomNumber,
	CustomString,
	CustomNil,
	CustomMap,
	CustomList
} from 'greybel-interpreter';
import {
	md5 as actualMd5,
	getFile,
	getPermissions,
	getTraversalPath
} from './utils';
import { loginLocal } from './shell';
import { create as createAptClient } from './apt-client';
import { create as createCrypto } from './crypto';
import { create as createMetaxploit } from './metaxploit';
import { create as createRouter } from './router';
import { create as createMetaMail } from './meta-mail';
import {
	getLocal,
	FileType,
	File,
	computers,
	routerNamespaces,
	RouterNamespace,
	routers,
	Router
} from './mock-environment';

import BasicInterface from './interface';

export function get_shell(user: any, password: any): BasicInterface {
	return loginLocal(user, password);
}

export function mail_login(username: any, password: any): BasicInterface {
	const { user, computer } = getLocal();
	
	return createMetaMail(user, computer);
}

export function get_router(ipAddress: any): BasicInterface {
	const { user } = getLocal();
	const target = ipAddress.toString();
	const router = routers.find((item: Router) => {
		return item.publicIp === target;
	});
	
	return createRouter(user, router);
}

export function get_switch(ipAddress: any): BasicInterface {
	const { user } = getLocal();
	const target = ipAddress.toString();
	const router = routers.find((item: Router) => {
		return item.publicIp === target;
	});
	
	return createRouter(user, router);
}

export function include_lib(libPath: any): BasicInterface | null {
	const { user, computer } = getLocal();
	const target = getTraversalPath(libPath.toString());
	const entityResult = getFile(computer.fileSystem, target);

	if (entityResult && !entityResult.isFolder) {
		const { r } = getPermissions(user, entityResult);

		if (r) {
			switch ((entityResult as File).type) {
				case FileType.AptClient:
					return createAptClient(user, computer);
				case FileType.Crypto:
					return createCrypto(user, computer);
				case FileType.Metaxploit:
					return createMetaxploit(user, computer);
				default:
			}
		}
	}
	
	return null;
}

export function md5(customValue: any): string | null {
	if (customValue instanceof CustomString) {
		return actualMd5(customValue.toString());
	}
	return null;
}

export function time(): number {
	return Date.now();
}


export function nslookup(hostname: any): string {
	const target = hostname.toString();
	const ns = routerNamespaces.find((item: RouterNamespace) => {
		return item.name === target;
	});
	
	return ns.router.publicIp;
}

export function whois(ipAddress: any): string {
	if (is_valid_ip(ipAddress)) {
		return [
			'Domain name: mytest.org',
			'Administrative contact: Rodd Mantil',
			'Email address: Mantil@goldm.info',
			'Phone: 782517348'
		].join('\n');
	}

	return 'Invalid IP address: ${ipAddress}';
}

export function is_valid_ip(ipAddress: any): boolean {
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress.toString());
}

export function is_lan_ip(ipAddress: any): boolean {
	return /^1(0|27|69\.254|72\.(1[6-9]|2[0-9]|3[0-1])|92\.168)\./.test(ipAddress.toString());
}

export function command_info(idCommand: any): string {
	return idCommand.toString().toUpperCase();
}

export function current_date(): string {
	const date = new Date();
	return `${date.getDay()}-${date.getMonth()}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
}

export function current_path(): string {
	return '/' + getLocal().home.join('/');
}

export function parent_path(): string {
	const { home } = getLocal();
	return '/' + home.slice(0, home.length - 1).join('/');
}

export function home_dir(): string {
	return '/' + getLocal().home.join('/');
}

export function program_path(): string {
	return '/' + getLocal().home.join('/') + '/myprogramm';
}

export function active_user(): string {
	return getLocal().user.username;
}

export function user_mail_address(): string {
	return getLocal().user.email;
}

export function user_bank_number(): string {
	return getLocal().user.userBankNumber;
}

export function format_columns(columns: any): string {
	//todo add formating
	return columns.toString();
}

export function user_input(message: any, isPassword: any, anyKey: any): string {
	return 'test-input';
}

export function clear_screen(): null {
	return null;
}

export function launch_path(): string {
	return '/' + getLocal().home.join('/') + '/myprogramm';
}