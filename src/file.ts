import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import { Type } from 'greybel-mock-environment';
import {
  copyFile,
  getFile,
  getFileIndex,
  getFilePath,
  getPermissions,
  getTraversalPath,
  parsePermissions,
  removeFile,
  transformFlagsToPermissions,
  traverseChildren
} from './utils';

export function create(user: Type.User, entity: Type.FileSystemEntity): BasicInterface {
  const itrface = new BasicInterface('file');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'chmod',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { w } = getPermissions(user, entity);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        const permissions = args.get('permissions').toString();
        const isRecursive = args.get('isRecursive').toTruthy();

        if (!/^[ugo](-|\+)[wrx]{1,3}$/i.test(permissions)) {
          return Promise.resolve(
            new CustomString('Invalid pattern for permissions')
          );
        }

        const userType: string = permissions[0];
        const operator = permissions[1];
        const getNewPermissions = (itemFile: Type.FileSystemEntity) => {
          const flags = parsePermissions(itemFile);

          permissions
            .substr(2)
            .split('')
            .forEach((item: string) => {
              if (flags?.[userType]?.[item]) {
                flags[userType][item] = operator === '+';
              }
            });

          return flags;
        };

        entity.permissions = transformFlagsToPermissions(
          getNewPermissions(entity)
        );

        if (isRecursive) {
          traverseChildren(
            entity,
            (item: Type.FileSystemEntity) => {
              const { w } = getPermissions(user, item);

              if (w) {
                item.permissions = transformFlagsToPermissions(
                  getNewPermissions(item)
                );
              }
            },
            true
          );
        }

        return Promise.resolve(new CustomString(''));
      }
    )
      .addArgument('permissions')
      .addArgument('isRecursive', new CustomBoolean(false))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'copy',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { r } = getPermissions(user, entity);

        if (!r) {
          return Promise.resolve(new CustomString('No read permissions'));
        }

        const path = args.get('path').toString();
        const newName = args.get('newName').toString();
        const traversalPath = getTraversalPath(path, getFilePath(entity));
        const folder = getFile(entity, traversalPath) as Type.Folder;

        if (folder && folder.isFolder) {
          const { w } = getPermissions(user, folder);

          if (!w) {
            return Promise.resolve(new CustomString('No write permissions'));
          }

          const result = getFileIndex(folder, newName);

          if (result) {
            removeFile(folder, newName);
          }

          if (entity.isFolder) {
            const newFolder = copyFile(entity, folder) as Type.Folder;
            newFolder.name = newName;
            folder.folders.push(newFolder);
          } else {
            const newFile = copyFile(entity, folder) as Type.File;
            newFile.name = newName;
            folder.files.push(newFile);
          }

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(new CustomString('Invalid path'));
      }
    )
      .addArgument('path')
      .addArgument('newName')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'move',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { r } = getPermissions(user, entity);

        if (!r) {
          return Promise.resolve(new CustomString('No read permissions'));
        }

        const path = args.get('path').toString();
        const newName = args.get('newName').toString();
        const traversalPath = getTraversalPath(path, getFilePath(entity));
        const folder = getFile(entity, traversalPath) as Type.Folder;

        if (folder && folder.isFolder) {
          const { w } = getPermissions(user, folder);

          if (!w) {
            return Promise.resolve(new CustomString('No write permissions'));
          }

          const result = getFileIndex(folder, newName);

          if (result) {
            removeFile(folder, newName);
          }

          if (entity.isFolder) {
            const newFolder = copyFile(entity, folder) as Type.Folder;
            newFolder.name = newName;
            folder.folders.push(newFolder);
          } else {
            const newFile = copyFile(entity, folder) as Type.File;
            newFile.name = newName;
            folder.files.push(newFile);
          }

          removeFile(entity.parent as Type.Folder, entity.name);

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(new CustomString('Invalid path'));
      }
    )
      .addArgument('path')
      .addArgument('newName')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'rename',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { w } = getPermissions(user, entity);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        const newName = args.get('newName').toString();

        entity.name = newName;

        return Promise.resolve(new CustomString(''));
      }
    ).addArgument('newName')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'path',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(
          new CustomString('/' + getFilePath(entity).join('/'))
        );
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'allow_import',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(Defaults.False);
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'parent',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        if (entity.name === '') {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(create(user, entity.parent));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'name',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(entity.name));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_content',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { r } = getPermissions(user, entity);

        if (!r) {
          return Promise.resolve(Defaults.Void);
        }

        const file = entity as Type.File;

        if (file.type !== Type.FileType.Plain) {
          return Promise.resolve(Defaults.Void);
        }

        return Promise.resolve(new CustomString(file.content || ''));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'set_content',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { w } = getPermissions(user, entity);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        const file = entity as Type.File;
        const content = args.get('content').toString();

        if (file.type !== Type.FileType.Plain) {
          return Promise.resolve(new CustomString('Invalid file type'));
        }

        file.content = content;

        return Promise.resolve(Defaults.True);
      }
    ).addArgument('content')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'is_binary',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.isFolder) {
          return Promise.resolve(Defaults.False);
        }

        const file = entity as Type.File;
        return Promise.resolve(new CustomBoolean(file.type !== Type.FileType.Plain));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'is_folder',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomBoolean(!!entity.isFolder));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'has_permission',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const permission = args.get('permission').toString().substr(0, 1);
        const permissionMap = getPermissions(user, entity);

        return Promise.resolve(new CustomBoolean(permissionMap[permission]));
      }
    ).addArgument('permission')
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'delete',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { w } = getPermissions(user, entity);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        removeFile(entity.parent as Type.Folder, entity.name);

        return Promise.resolve(new CustomString(''));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_folders',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        if (!entity.isFolder) {
          return Promise.resolve(Defaults.Void);
        }

        const result = (entity as Type.Folder).folders.map((folder: Type.Folder) => {
          return create(user, folder);
        });

        return Promise.resolve(new CustomList(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_files',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        if (!entity.isFolder) {
          return Promise.resolve(Defaults.Void);
        }

        const result = (entity as Type.Folder).files.map((file: Type.File) => {
          return create(user, file);
        });

        return Promise.resolve(new CustomList(result));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'permissions',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(entity.permissions));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'owner',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(entity.owner));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'set_owner',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const { w } = getPermissions(user, entity);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        const owner = args.get('owner').toString();
        const isRecursive = args.get('isRecursive').toTruthy();

        if (isRecursive) {
          traverseChildren(
            entity,
            (item: Type.FileSystemEntity) => {
              const { w } = getPermissions(user, item);

              if (w) {
                item.owner = owner;
              }
            },
            true
          );
        }

        return Promise.resolve(new CustomString(''));
      }
    )
      .addArgument('owner')
      .addArgument('isRecursive', new CustomBoolean(false))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('test-group'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'set_group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('Not yet supported'));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'size',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString('1337'));
      }
    )
  );

  return itrface;
}
