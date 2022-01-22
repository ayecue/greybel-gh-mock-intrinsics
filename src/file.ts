import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import { File, FileSystemEntity, Folder, User } from './mock-environment';
import {
	parsePermissions,
	getPermissions,
	transformFlagsToPermissions,
	getFile,
	hasFile,
	removeFile,
	getTraversalPath
} from './utils';

export function create(user: User, entity: FileSystemEntity, path: string[]): BasicInterface {
	const itrface: Map<string, Function> = new Map();
	const iterateThroughChildren = (entity: FileSystemEntity, callback: (v: FileSystemEntity) => void, skip?: boolean): void => {
		if (!entity.isFolder) {
			return;
		}

		const folder = entity as Folder;

		if (!skip) {
			callback(entity);
		}

		folder.files.forEach((item: File) => callback(item));
		folder.folders.forEach((item: Folder) => iterateThroughChildren(item, callback));
	};
	const permissionTansformOffset: { [type: string]: number } = {
		'u': 1,
		'g': 4,
		'o': 7
	};

	itrface.set('chmod', (permissions: any, isRecursive: any): string => {
		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write access';
		}
		
		const meta = {
			permissions: permissions.toString(),
			isRecursive: !!isRecursive?.valueOf()
		};

		if (!/^[ugo](\-|\+)[wrx]{1,3}$/i.test(meta.permissions)) {
			return 'Invalid pattern for permissions';
		}

		const userType: string = meta.permissions[0];
		const operator = meta.permissions[1];
		const getNewPermissions = (itemFile: FileSystemEntity) => {
			const flags = parsePermissions(itemFile);
			
			meta.permissions.substr(2).split('').forEach((item: string) => {
				if (flags?.[userType]?.[item]) {
					flags[userType][item] = operator === '+';
				}
			});

			return flags;
		}

		entity.permissions = transformFlagsToPermissions(getNewPermissions(entity));

		if (meta.isRecursive) {
			iterateThroughChildren(entity, (item: FileSystemEntity) => {
				item.permissions = transformFlagsToPermissions(getNewPermissions(item));
			}, true);
		}
		
		return '';
	});

	itrface.set('copy', (path: any, newName: any): string => {
		const { r } = getPermissions(user, entity);

		if (!r) {
			return 'No read access';
		}
		
		const meta = {
			path: path.toString(),
			newName: newName.toString()
		};

		
		return '';
	});


	return new BasicInterface('File', itrface);
}