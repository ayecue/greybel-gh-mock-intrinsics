import {
	User,
	FileSystemEntity,
	File,
	Folder,
	Library,
	FileType,
	Computer,
	VulnerabilityActionUser,
	Service
} from './types';
import md5 from 'blueimp-md5';
import mockEnvironment from './mock/environment';

export interface PermissionSegment {
	[permissionType: string]: boolean;
}

export interface PermissionMap {
	[type: string]: PermissionSegment;
}

export function transformFlagsToPermissions(permissionMap: PermissionMap): string {
	const segments = Object.keys(permissionMap).map((type: string) => {
		const map = permissionMap[type];

		return `${map.r ? 'r' : '-'}${map.w ? 'w' : '-'}${map.x ? 'x' : '-'}`;
	});

	return segments.join('');
}

export function parsePermissions(file: FileSystemEntity): PermissionMap {
	const permSegments = file.permissions.substr(1).match(/.{1,3}/g);

	if (permSegments.length !== 3) {
		throw Error('Invalid permissions.');
	}

	const [ u, g, o ] = permSegments;

	return {
		'u': {
			r: u[0] !== '-',
			w: u[1] !== '-',
			x: u[2] !== '-'
		},
		'g': {
			r: g[0] !== '-',
			w: g[1] !== '-',
			x: g[2] !== '-'
		},
		'o': {
			r: o[0] !== '-',
			w: o[1] !== '-',
			x: o[2] !== '-'
		}
	};
}

export function getPermissions(user: User, file: FileSystemEntity): PermissionSegment {
	// g is ignored for now
	// todo: add group logic
	const parsedPermissions = parsePermissions(file);

	if (file.owner === user.username) {
		return parsedPermissions.u;
	}

	return parsedPermissions.o;
}

export function getFile (entity: FileSystemEntity, path: string[]): FileSystemEntity | null {
	if (!path || !entity.isFolder) {
		return null;
	}

	if (path.length === 0) {
		return entity;
	}

	const nextPath = [].concat(path);
	const currentSegment = nextPath.shift();
	const folder = entity as Folder;
	const nextEntity: FileSystemEntity = (
		folder.files.find((item: File) => item.name === currentSegment) ||
		folder.folders.find((item: Folder) => item.name === currentSegment)
	);

	if (!nextEntity) {
		return null;
	}

	if (nextPath.length === 0) {
		return nextEntity;
	}

	return getFile(nextEntity, nextPath);
}

export function hasFile (folder: Folder, fileName: string): boolean {
	return !!getFileIndex(folder, fileName);
}

export function getFileIndex (folder: Folder, fileName: string): { isFolder: boolean, index: number } {
	const fileIndex = folder.files.findIndex((item: File) => item.name === fileName);

	if (fileIndex !== -1 && fileIndex !== undefined) {
		return {
			isFolder: false,
			index: fileIndex
		};
	}

	const folderIndex = folder.folders.findIndex((item: Folder) => item.name === fileName);

	if (folderIndex !== -1 && folderIndex !== undefined) {
		return {
			isFolder: true,
			index: folderIndex
		};
	}

	return null;
}

export function putFile (folder: Folder, file: File): void {
	removeFile(folder, file.name);
	file.parent = folder;
	folder.files.push(file);
}

export function removeFile (folder: Folder, fileName: string): boolean {
	const result = getFileIndex(folder, fileName);

	if (!result) {
		return false;
	}

	const { isFolder, index } = result;
	let entity;

	if (isFolder) {
		entity = folder.folders[index];
		entity.deleted = true;
		folder.folders.splice(index, 1);
	} else {
		entity = folder.files[index];
		entity.deleted = true;
		folder.files.splice(index, 1);
	}

	traverseChildren(entity, (item: FileSystemEntity) => {
		item.deleted = true;
	});

	return true;
}

export function traverseChildren (entity: FileSystemEntity, callback: (v: FileSystemEntity) => void, skip?: boolean): void {
	if (!entity.isFolder) {
		return;
	}

	const folder = entity as Folder;

	if (!skip) {
		callback(entity);
	}

	folder.files.forEach((item: File) => callback(item));
	folder.folders.forEach((item: Folder) => traverseChildren(item, callback));
}

export function copyFile (entity: FileSystemEntity, parent: FileSystemEntity): FileSystemEntity {
	const newEntity: FileSystemEntity = {
		name: entity.name,
		permissions: entity.permissions,
		owner: entity.owner,
		isFolder: entity.isFolder,
		parent
	};

	if (entity.isFolder) {
		const folder = entity as Folder;
		const newFolder = newEntity as Folder;

		newFolder.files = folder.files.map((item: File) => copyFile(item, newFolder) as File);
		newFolder.folders = folder.folders.map((item: Folder) => copyFile(item, newFolder) as Folder);

		return newFolder;
	}

	const file = entity as File;
	const newFile = newEntity as File;

	newFile.content = file.content;
	newFile.type = file.type;

	return newFile;
}

export function getTraversalPath (path: string | null): null | string[] {
	if (!path) {
		return null;
	} else if (path === '/') {
		return [];
	}

	return path.startsWith('/')
		? path.substr(1).split('/')
		: mockEnvironment.getLocal().home.concat(path.split('/'));
}

export function getFileLibrary (file: File): Library | null {
	switch (file.type) {
		case FileType.AptClient:
			return Library.APT;
		case FileType.Crypto:
			return Library.CRYPTO;
		case FileType.Init:
			return Library.INIT;
		case FileType.KernelModule:
			return Library.KERNEL_MODULE;
		case FileType.Metaxploit:
			return Library.METAXPLOIT;
		case FileType.Net:
			return Library.NET;
		default:
	}

	return null;
}

export function getServiceLibrary (service: Service): Library | null {
	switch (service) {
		case Service.FTP:
			return Library.FTP;
		case Service.HTTP:
			return Library.HTTP;
		case Service.RSHELL:
			return Library.RSHELL;
		case Service.SMTP:
			return Library.SMTP;
		case Service.SQL:
			return Library.SQL;
		case Service.SSH:
			return Library.SSH;
		default:
	}

	return null;
}

export function getUserByVulnerability (vulActionUser: VulnerabilityActionUser, computer: Computer): User {
	switch (vulActionUser) {
		case VulnerabilityActionUser.NORMAL:
			return computer.users[1];
		case VulnerabilityActionUser.ROOT:
			return computer.users[0];
		default:
	}

	return {
		username: 'guest',
		password: '',
		passwordHashed: '',
		email: '',
		userBankNumber: ''
	};
}

export function changePassword (computer: Computer, username: string, password: string): boolean {
	const user = computer.users.find((item: User) => {
		return (
			item.username === username &&
			item.password === password
		);
	});

	if (user) {
		user.password = password;
		user.passwordHashed = md5(password);
		return true;
	}

	return false;
}