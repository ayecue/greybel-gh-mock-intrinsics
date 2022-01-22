import crypto from 'crypto';
import {
	User,
	FileSystemEntity,
	getLocal,
	File,
	Folder
} from './mock-environment';

export function md5(value: string): string {
	return crypto.createHash('md5').update(value).digest('hex');
}

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

//https://stackoverflow.com/a/47593316
export function xmur3(str: string): () => number {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

export function getFile (entity: FileSystemEntity, path: string[]): FileSystemEntity | null {
	if (!entity.isFolder) {
		return null;
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
	} else if (nextPath.length === 0) {
		return nextEntity;
	}

	return getFile(nextEntity, nextPath);
}

export function hasFile (folder: Folder, fileName: string): boolean {
	return !!(
		folder.files.find((item: File) => item.name === fileName) ||
		folder.folders.find((item: Folder) => item.name === fileName)
	);
}


export function removeFile (folder: Folder, fileName: string): boolean {
	const fileIndex = folder.files.findIndex((item: File) => item.name === fileName);

	if (fileIndex !== -1) {
		folder.files.splice(fileIndex, 1);
		return true;
	}

	const folderIndex = folder.folders.findIndex((item: Folder) => item.name === fileName);

	if (folderIndex !== -1) {
		folder.folders.splice(folderIndex, 1);
		return true;
	}

	return false;
}


export function getTraversalPath (path: string): string[] {
	return path.startsWith('/') ? path.substr(1).split('/') : getLocal().home.concat(path.split('/'));
}