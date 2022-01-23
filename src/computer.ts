import { CustomNil, CustomBoolean } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	Computer,
	User,
	Port,
	homePath,
	FileSystemEntity,
	Folder,
	File,
	FileType,
	NetworkDevice,
	generateUser,
	getUserFolder,
	networks,
	Network
} from './mock-environment';
import { create as createFile } from './file';
import { create as createPort } from './port';
import {
	getPermissions,
	getFile,
	hasFile,
	removeFile,
	getTraversalPath,
	changePassword
} from './utils';


export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('get_ports', (_: any): BasicInterface[] => {
		return computer?.ports.map((item: Port) => createPort(computer, item)) || [];
	});

	itrface.set('File', (_: any, path: any): BasicInterface | null => {
		const target = getTraversalPath(path?.toString());
		const entityResult = getFile(computer.fileSystem, target);

		if (!entityResult) {
			return null;
		}
		
		return createFile(user, entityResult);
	});

	itrface.set('create_folder', (_: any, path: any, folderName: any): boolean => {
		const target = getTraversalPath(path?.toString());
		const entityResult = getFile(computer.fileSystem, target);

		if (entityResult && entityResult.isFolder) {
			const { w } = getPermissions(user, entityResult);
			const folder = entityResult as Folder;

			if (w && !hasFile(folder, folderName?.toString())) {
				folder.folders.push({
					name: folderName?.toString(),
					owner: user.username,
					permissions: entityResult.permissions,
					isFolder: true,
					parent: folder,
					folders: [],
					files: []
				});

				return true;
			}
		}
		
		return false;
	});

	itrface.set('is_network_active', (_: any): boolean => {
		return true;
	});

	itrface.set('touch', (_: any, path: any, fileName: any): boolean => {
		const containingFolder = getTraversalPath(path?.toString());
		const target = fileName?.toString();
		const entityResult = getFile(computer.fileSystem, containingFolder);

		if (entityResult && entityResult.isFolder) {
			const { w } = getPermissions(user, entityResult);
			const folder = entityResult as Folder;

			if (w && !hasFile(folder, target)) {
				folder.files.push({
					name: target,
					owner: user.username,
					permissions: entityResult.permissions,
					type: FileType.Plain,
					parent: folder
				});

				return true;
			}
		}
		
		return false;
	});

	itrface.set('show_procs', (_: any): string => {
		return [
			'USER PID CPU MEM COMMAND',
			'root 2134 0.0% 13.37% kernel_task',
			'root 1864 0.0% 4.20% Xorg'
		].join('\n');
	});

	itrface.set('network_devices', (_: any): string => {
		return computer.networkDevices.map((item: NetworkDevice) => {
			return `${item.type} ${item.id} ${item.active}`;
		}).join('\n');
	});

	itrface.set('change_password', (_: any, username: any, password: any): boolean => {
		if (user.username === 'root') {
			const meta = {
				username: username?.toString(),
				password: password?.toString()
			};

			return changePassword(computer, meta.username, meta.password);
		}

		return false;
	});

	itrface.set('create_user', (_: any, username: any, password: any): boolean => {
		if (user.username === 'root') {
			const meta = {
				username: username?.toString(),
				password: password?.toString()
			};
			const existingUser = computer.users.find((item: User) => {
				return item.username === meta.username;
			});

			if (!existingUser) {
				const homeFolder = getFile(computer.fileSystem, ['home']) as Folder;

				if (!hasFile(homeFolder, meta.username)) {
					computer.users.push(generateUser(meta.username, meta.password));
					homeFolder.folders.push(getUserFolder(homeFolder, meta.username));
					return true;
				}
			}
		}

		return false;
	});

	itrface.set('delete_user', (_: any, username: any, removeHome: any): boolean => {
		if (user.username === 'root') {
			const meta = {
				username: username?.toString(),
				removeHome: removeHome && removeHome instanceof CustomBoolean ? removeHome.value : removeHome?.valueOf()
			};

			if (meta.username === 'root' || meta.username === 'guest') {
				return false;
			}

			const userIndex = computer.users.findIndex((item: User) => {
				return item.username === meta.username;
			});

			if (userIndex != -1) {
				computer.users.splice(userIndex, 1);

				if (meta.removeHome) {
					const homeFolder = getFile(computer.fileSystem, ['home']) as Folder;
					
					if (homeFolder) {
						removeFile(homeFolder, meta.username);
					}
				}

				return true;
			}
		}

		return false;
	});

	itrface.set('create_group', (_: any): boolean => {
		// g is ignored for now
		// todo: add group logic
		return false;
	});

	itrface.set('delete_group', (_: any): boolean => {
		// g is ignored for now
		// todo: add group logic
		return false;
	});

	itrface.set('groups', (_: any): string => {
		// g is ignored for now
		// todo: add group logic
		return '';
	});

	itrface.set('close_program', (_: any): boolean => {
		//programs are not supported for now
		if (user.username !== 'root') {
			return false;
		}

		return Math.random() < 0.5;
	});

	itrface.set('wifi_networks', (_: any): string[] => {
		//programs are not supported for now
		return networks.map((item: Network) => {
			return `${item.mac} ${item.percentage}% ${item.name}`;
		});
	});

	itrface.set('connect_wifi', (_: any): boolean => {
		//connect_wifi will always default to the standart one for now
		return true;
	});

	itrface.set('connect_ethernet', (_: any): boolean => {
		//connect_ethernet not yet supported
		return false;
	});

	itrface.set('network_gateway', (): string => {
		//connect_ethernet not yet supported
		return computer.localIp;
	});

	itrface.set('active_net_card', (): string => {
		//connect_ethernet not yet supported
		return 'WIFI';
	});

	itrface.set('local_ip', (): string => {
		//connect_ethernet not yet supported
		return computer.localIp;
	});

	itrface.set('public_ip', (): string => {
		//connect_ethernet not yet supported
		return computer.router.publicIp;
	});

	return new BasicInterface('Computer', itrface);
}