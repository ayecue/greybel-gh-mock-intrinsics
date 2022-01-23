import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	User,
	Computer,
	File,
	FileType,
	vulnerabilities,
	Vulnerability,
	VulnerabilityAction,
	Library
} from './mock-environment';
import {
	getFile,
	getFileLibrary,
	getUserByVulnerability,
	changePassword
} from './utils';
import { create as createShell } from './shell';
import { create as createComputer } from './computer';
import { create as createFile } from './file';

export function create(computer: Computer, targetComputer: Computer, library: Library): BasicInterface {
	const itrface: Map<string, Function> = new Map();
	const isLan = computer.router.publicIp === targetComputer.router.publicIp;
	const isLocal = isLan && computer.localIp === targetComputer.localIp;
	const exploits = vulnerabilities.filter((item: Vulnerability) => {
		return item.library === library && item.remote !== isLocal;
	});

	itrface.set('lib_name', (_: any): string => {
		return library;
	});

	itrface.set('version', (_: any): string => {
		return '1.0.0.0';
	});

	itrface.set('overflow', (_: any, memAddress: any, sector: any, optArgs: any): null | boolean | string | BasicInterface => {
		const meta = {
			memAddress: memAddress?.toString(),
			sector: sector?.toString(),
			optArgs: optArgs?.toString()
		};
		const vul = exploits.find((item: Vulnerability) => {
			return (
				item.memAddress === meta.memAddress &&
				item.sector === meta.sector
			);
		});

		if (!vul) {
			return null;
		}

		switch (vul.action) {
			case VulnerabilityAction.COMPUTER:
				return createComputer(getUserByVulnerability(vul.user, targetComputer), targetComputer);
			case VulnerabilityAction.SHELL:
				return createShell(getUserByVulnerability(vul.user, targetComputer), targetComputer);
			case VulnerabilityAction.FOLDER:
				const file = getFile(targetComputer.fileSystem, vul.folder);
				return createFile(getUserByVulnerability(vul.user, targetComputer), file);
			case VulnerabilityAction.FIREWALL:
				return 'Firewall test';
			case VulnerabilityAction.PASSWORD:
				if (!meta.optArgs) {
					return 'Invalid args';
				}
				const user = getUserByVulnerability(vul.user, targetComputer);
				return changePassword(targetComputer, user.username, meta.optArgs);
		}

		return null;
	});

	return new BasicInterface('metaLib', itrface, new Map([
		['exploits', exploits]
	]));
}