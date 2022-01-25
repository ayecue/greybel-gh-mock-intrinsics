import { CustomString } from 'greybel-interpreter';
import {
	getFile,
	getPermissions,
	getTraversalPath
} from './utils';
import { default as actualMd5 } from 'blueimp-md5';
import { loginLocal } from './shell';
import { create as createAptClient } from './apt-client';
import { create as createCrypto } from './crypto';
import { create as createMetaxploit } from './metaxploit';
import { create as createRouter } from './router';
import { create as createMetaMail } from './meta-mail';
import {
	FileType,
	File
} from './types';
import mockEnvironment from './mock/environment';

import BasicInterface from './interface';

export function getShell(user: any, password: any): BasicInterface {
	return loginLocal(user, password);
}

export function mailLogin(username: any, password: any): BasicInterface {
	const email = mockEnvironment.getEmailViaLogin(username?.toString(), password?.toString());
	
	if (!email) {
		return null;
	}

	return createMetaMail(email);
}

export function getRouter(ipAddress: any): BasicInterface {
	const { user, computer } = mockEnvironment.getLocal();
	const target = ipAddress?.toString();
	const router = mockEnvironment.getRouter(target || computer.router?.publicIp);
	
	return createRouter(user, router || computer.router);
}

export function getSwitch(ipAddress: any): BasicInterface {
	const { user, computer } = mockEnvironment.getLocal();
	const target = ipAddress?.toString();
	const router = mockEnvironment.getRouter(target || computer.router?.publicIp);
	
	return createRouter(user, router || computer.router);
}

export function includeLib(libPath: any): BasicInterface | null {
	const { user, computer } = mockEnvironment.getLocal();
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
	const router = mockEnvironment.findRouterViaNS(target);
	return router?.publicIp;
}

export function whois(ipAddress: any): string {
	const target = ipAddress?.toString();
	if (isValidIp(target)) {
		return mockEnvironment.getRouter(target).whoisDescription;
	}
	return 'Invalid IP address: ${ipAddress}';
}

export function isValidIp(ipAddress: any): boolean {
	const target = ipAddress?.toString();
	return mockEnvironment.isValidIp(target);
}

export function isLanIp(ipAddress: any): boolean {
	const target = ipAddress?.toString();
	return mockEnvironment.isLanIp(target);
}

export function commandInfo(idCommand: any): string {
	return idCommand?.toString().toUpperCase();
}

export function currentDate(): string {
	const date = new Date(Date.now());
	return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
}

export function currentPath(): string {
	return '/' + mockEnvironment.getLocal().home.join('/');
}

export function parentPath(): string {
	const { home } = mockEnvironment.getLocal();
	return '/' + home.slice(0, home.length - 1).join('/');
}

export function homeDir(): string {
	return '/' + mockEnvironment.getLocal().home.join('/');
}

export function programPath(): string {
	return '/' + mockEnvironment.getLocal().home.join('/') + '/myprogramm';
}

export function activeUser(): string {
	return mockEnvironment.getLocal().user.username;
}

export function userMailAddress(): string {
	return mockEnvironment.getLocal().user.email;
}

export function userBankNumber(): string {
	return mockEnvironment.getLocal().user.userBankNumber;
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
	return '/' + mockEnvironment.getLocal().home.join('/') + '/myprogramm';
}

export function typeOf(value: any): string {
	return value.getType();
}