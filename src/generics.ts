import { CustomString } from 'greybel-interpreter';
import {
	getFile,
	getPermissions,
	getTraversalPath
} from './utils';
import { md5 as actualMd5 } from './helper';
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

export function getShell(user: any, password: any): BasicInterface {
	return loginLocal(user, password);
}

export function mailLogin(username: any, password: any): BasicInterface {
	const { user, computer } = getLocal();
	
	return createMetaMail(user, computer);
}

export function getRouter(ipAddress: any): BasicInterface {
	const { user, computer } = getLocal();
	const target = ipAddress?.toString();
	const router = routers.find((item: Router) => {
		return item.publicIp === target;
	});
	
	return createRouter(user, router || computer.router);
}

export function getSwitch(ipAddress: any): BasicInterface {
	const { user, computer } = getLocal();
	const target = ipAddress?.toString();
	const router = routers.find((item: Router) => {
		return item.publicIp === target;
	});
	
	return createRouter(user, router || computer.router);
}

export function includeLib(libPath: any): BasicInterface | null {
	const { user, computer } = getLocal();
	const target = getTraversalPath(libPath?.toString());
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
		return actualMd5(customValue?.toString());
	}
	return null;
}

export function time(): number {
	return Date.now();
}

export function nslookup(hostname: any): string {
	const target = hostname?.toString();
	const ns = routerNamespaces.find((item: RouterNamespace) => {
		return item.name === target;
	});
	
	return ns.router.publicIp;
}

export function whois(ipAddress: any): string {
	if (isValidIp(ipAddress)) {
		return [
			'Domain name: mytest.org',
			'Administrative contact: Rodd Mantil',
			'Email address: Mantil@goldm.info',
			'Phone: 782517348'
		].join('\n');
	}

	return 'Invalid IP address: ${ipAddress}';
}

export function isValidIp(ipAddress: any): boolean {
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress?.toString());
}

export function isLanIp(ipAddress: any): boolean {
	return /^1(0|27|69\.254|72\.(1[6-9]|2[0-9]|3[0-1])|92\.168)\./.test(ipAddress?.toString());
}

export function commandInfo(idCommand: any): string {
	return idCommand?.toString().toUpperCase();
}

export function currentDate(): string {
	const date = new Date(Date.now());
	return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
}

export function currentPath(): string {
	return '/' + getLocal().home.join('/');
}

export function parentPath(): string {
	const { home } = getLocal();
	return '/' + home.slice(0, home.length - 1).join('/');
}

export function homeDir(): string {
	return '/' + getLocal().home.join('/');
}

export function programPath(): string {
	return '/' + getLocal().home.join('/') + '/myprogramm';
}

export function activeUser(): string {
	return getLocal().user.username;
}

export function userMailAddress(): string {
	return getLocal().user.email;
}

export function userBankNumber(): string {
	return getLocal().user.userBankNumber;
}

export function formatColumns(columns: any): string {
	//todo add formating
	return columns?.toString();
}

export function userInput(message: any, isPassword: any, anyKey: any): string {
	return 'test-input';
}

export function clearScreen(): null {
	return null;
}

export function launchPath(): string {
	return '/' + getLocal().home.join('/') + '/myprogramm';
}

export function typeOf(value: any): string {
	return value.getType();
}