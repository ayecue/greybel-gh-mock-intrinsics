import { CustomMap } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	User,
	Computer,
	File,
	VulnerabilityRequirements,
	Vulnerability,
	Library
} from './types';
import {
	getFile,
	getFileLibrary,
	getTraversalPath,
	getServiceLibrary,
	getHomePath
} from './utils';
import { create as createMetaLib } from './meta-lib';
import { create as createNetSession } from './net-session';
import mockEnvironment from './mock/environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('load', (_: any, path: any): BasicInterface | null => {
		const meta = {
			path: path?.toString()
		};
		const traversalPath = getTraversalPath(meta.path, getHomePath(user, computer));
		const file = getFile(computer.fileSystem, traversalPath) as File;
		const library = getFileLibrary(file);

		if (!library) {
			return null;
		}

		return createMetaLib(computer, computer, library);
	});

	itrface.set('net_use', (_: any, ipAddress: any, port: any): BasicInterface | null => {
		const meta = {
			ipAddress: ipAddress?.toString(),
			port: Number(port?.valueOf())
		};
		const router = mockEnvironment.getRouterByIp(meta.ipAddress);

		if (!router) {
			return null;
		}

		if (meta.port === 0 || Number.isNaN(meta.port)) {
			return createNetSession(computer, router, Library.KERNEL_ROUTER);
		}

		const result = mockEnvironment.getForwardedPortOfRouter(router, meta.port);

		if (!result) {
			return null;
		}

		const library = getServiceLibrary(result.port.service);

		if (!library) {
			return null;
		}

		return createNetSession(computer, result.computer, library);
	});

	itrface.set('scan', (_: any, metaLib: CustomMap): string[] => {
		if (metaLib instanceof CustomMap) {
			const meta = {
				metaLib: metaLib as BasicInterface
			};
			const exploits: Vulnerability[] = meta.metaLib.value.get('exploits');
	
			if (exploits) {
				const zones = exploits.map((x: Vulnerability) => {
					return x.memAddress;
				});

				return Array.from(new Set(zones));
			}
		}

		return [];
	});

	itrface.set('scan_address', (_: any, metaLib: CustomMap, memAddress: any): string => {
		if (metaLib instanceof CustomMap) {
			const meta = {
				metaLib: metaLib as BasicInterface,
				memAddress: memAddress?.toString()
			};
			const exploits: Vulnerability[] = meta.metaLib.value.get('exploits');
	
			if (exploits) {
				const result = exploits
					.filter((x: Vulnerability) => {
						return x.memAddress === meta.memAddress;
					})
					.map((x: Vulnerability) => {
						return [
							`${x.details} <b>${x.sector}</b>. Buffer overflow.`,
							...x.required.map((r: VulnerabilityRequirements) => {
								switch (r) {
									case VulnerabilityRequirements.LIBRARY:
										return '* Using namespace <b>net.so</b> compiled at version <b>1.0.0.0</b>';
									case VulnerabilityRequirements.REGISTER_AMOUNT:
										return '* Checking registered users equal to 2.';
									case VulnerabilityRequirements.ANY_ACTIVE:
										return '* Checking an active user.';
									case VulnerabilityRequirements.ROOT_ACTIVE:
										return '* Checking root active user.';
									case VulnerabilityRequirements.LOCAL:
										return '* Checking existing connection in the local network.';
									case VulnerabilityRequirements.FORWARD:
										return '* 1337 port forwarding configured from router to the target computer.';
									case VulnerabilityRequirements.GATEWAY:
										return '* 1337 computers using this router as gateway.';
								}
							})
						].join('\n');
					})
					.join('\n');

				return result;
			}
		}

		return null;
	});

	itrface.set('sniffer', (_: any): string => {
		return 'No yet supported';
	});

	itrface.set('rshell_client', (_: any): boolean => {
		return false;
	});

	itrface.set('rshell_server', (_: any): BasicInterface[] => {
		return [];
	});

	return new BasicInterface('metaxploit', itrface);
}