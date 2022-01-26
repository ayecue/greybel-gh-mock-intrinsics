import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
	User,
	FileType,
	FileSystemEntity,
	Folder,
	File
} from './types';
import {
	parsePermissions,
	getPermissions,
	transformFlagsToPermissions,
	getFile,
	getFilePath,
	removeFile,
	getTraversalPath,
	getFileIndex,
	traverseChildren,
	copyFile
} from './utils';

export function create(user: User, entity: FileSystemEntity): BasicInterface {
	const itrface: Map<string, Function> = new Map();
	const permissionTansformOffset: { [type: string]: number } = {
		'u': 1,
		'g': 4,
		'o': 7
	};

	itrface.set('chmod', (_: any, permissions: any, isRecursive: any): string => {
		if (entity.deleted) {
			return null;
		}

		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write permissions';
		}
		
		const meta = {
			permissions: permissions?.toString(),
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
			traverseChildren(entity, (item: FileSystemEntity) => {
				const { w } = getPermissions(user, item);

				if (w) {
					item.permissions = transformFlagsToPermissions(getNewPermissions(item));
				}
			}, true);
		}
		
		return '';
	});

	itrface.set('copy', (_: any, path: any, newName: any): string | boolean | null => {
		if (entity.deleted) {
			return null;
		}

		const { r } = getPermissions(user, entity);

		if (!r) {
			return 'No read permissions';
		}
		
		const meta = {
			path: path?.toString(),
			newName: newName?.toString()
		};
		const traversalPath = getTraversalPath(meta.path, getFilePath(entity));
		const folder = getFile(entity, traversalPath) as Folder;

		if (folder && folder.isFolder) {
			const { w } = getPermissions(user, folder);

			if (!w) {
				return 'No write permissions';
			}

			const result = getFileIndex(folder, meta.newName);

			if (result) {
				removeFile(folder, meta.newName);
			}

			if (entity.isFolder) {
				const newFolder = copyFile(entity, folder) as Folder;
				newFolder.name = meta.newName;
				folder.folders.push(newFolder);
			} else {
				const newFile = copyFile(entity, folder) as File;
				newFile.name = meta.newName;
				folder.files.push(newFile);
			}

			return true;
		} else {
			return 'Invalid path';
		}
		
		return null;
	});

	itrface.set('move', (_: any, path: any, newName: any): string | boolean | null => {
		if (entity.deleted) {
			return null;
		}

		const { r } = getPermissions(user, entity);

		if (!r) {
			return 'No read permissions';
		}
		
		const meta = {
			path: path?.toString(),
			newName: newName?.toString()
		};
		const traversalPath = getTraversalPath(meta.path, getFilePath(entity));
		const folder = getFile(entity, traversalPath) as Folder;

		if (folder && folder.isFolder) {
			const { w } = getPermissions(user, folder);

			if (!w) {
				return 'No write permissions';
			}

			const result = getFileIndex(folder, meta.newName);

			if (result) {
				removeFile(folder, meta.newName);
			}

			if (entity.isFolder) {
				const newFolder = copyFile(entity, folder) as Folder;
				newFolder.name = meta.newName;
				folder.folders.push(newFolder);
			} else {
				const newFile = copyFile(entity, folder) as File;
				newFile.name = meta.newName;
				folder.files.push(newFile);
			}

			removeFile(entity.parent as Folder, entity.name);

			return true;
		} else {
			return 'Invalid path';
		}
		
		return null;
	});

	itrface.set('rename', (_: any, newName: any): string | boolean | null => {
		if (entity.deleted) {
			return null;
		}

		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write permissions';
		}
		
		const meta = {
			newName: newName?.toString()
		};
		
		entity.name = meta.newName;
		
		return '';
	});

	itrface.set('path', (_: any): string | null => {
		if (entity.deleted) {
			return null;
		}

		return '/' + getFilePath(entity).join('/');
	});

	itrface.set('parent', (_: any): BasicInterface | null => {
		if (entity.deleted) {
			return null;
		}

		if (entity.name === '') {
			return null;
		}

		return create(user, entity.parent);
	});

	itrface.set('name', (_: any): string => {
		return entity.name;
	});

	itrface.set('get_content', (_: any): string | null => {
		if (entity.deleted) {
			return null;
		}

		const { r } = getPermissions(user, entity);

		if (!r) {
			return null;
		}

		const file = entity as File;

		if (file.type !== FileType.Plain) {
			return null;
		}

		return file.content;
	});

	itrface.set('set_content', (_: any, content: any): string | boolean => {
		if (entity.deleted) {
			return null;
		}

		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write permissions';
		}

		const file = entity as File;
		const meta = {
			content: content?.toString()
		};

		if (file.type !== FileType.Plain) {
			return 'Invalid file type';
		}

		file.content = meta.content;

		return true;
	});

	itrface.set('is_binary', (_: any): boolean => {
		if (entity.isFolder) {
			return false;
		}

		const file = entity as File;
		return file.type !== FileType.Plain;
	});

	itrface.set('is_folder', (_: any): boolean => {
		return !!entity.isFolder;
	});

	itrface.set('has_permission', (_: any, permission: any): boolean => {
		const meta = {
			permission: permission?.toString().substr(0, 1)
		};
		const permissions = getPermissions(user, entity);

		return permissions[meta.permission];
	});

	itrface.set('delete', (_: any): string | null => {
		if (entity.deleted) {
			return null;
		}

		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write permissions';
		}

		removeFile(entity.parent as Folder, entity.name);

		return '';
	});

	itrface.set('get_folders', (_: any): BasicInterface[] => {
		if (entity.deleted) {
			return null;
		}

		if (!entity.isFolder) {
			return null;
		}

		return (entity as Folder).folders.map((folder: Folder) => {
			return create(user, folder);
		});
	});

	itrface.set('get_files', (_: any): BasicInterface[] => {
		if (entity.deleted) {
			return null;
		}

		if (!entity.isFolder) {
			return null;
		}

		return (entity as Folder).files.map((file: File) => {
			return create(user, file);
		});
	});

	itrface.set('permissions', (_: any): string => {
		return entity.permissions;
	});

	itrface.set('owner', (_: any): string => {
		return entity.owner;
	});

	itrface.set('set_owner', (_: any, owner: any, isRecursive: any): string => {
		if (entity.deleted) {
			return null;
		}

		const { w } = getPermissions(user, entity);

		if (!w) {
			return 'No write permissions';
		}

		const meta = {
			owner: owner?.toString(),
			isRecursive: !!isRecursive?.valueOf()
		};

		entity.owner = meta.owner;

		if (meta.isRecursive) {
			traverseChildren(entity, (item: FileSystemEntity) => {
				const { w } = getPermissions(user, item);

				if (w) {
					item.owner =  meta.owner;
				}
			}, true);
		}

		return '';
	});

	itrface.set('group', (_: any): string => {
		return 'test-group';
	});

	itrface.set('set_group', (_: any, group: any, isRecursive: any): string => {
		return 'Not yet supported';
	});

	itrface.set('size', (_: any): number => {
		return 1337;
	});

	itrface.set('meta_info', (_: any): null => {
		return null;
	});

	return new BasicInterface('file', itrface);
}