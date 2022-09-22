import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { Type, Utils } from 'greybel-mock-environment';
import { Folder } from 'greybel-mock-environment/dist/types';

import BasicInterface from './interface';

export function create(user: Type.User, entity: Type.FSEntity): BasicInterface {
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

        const { w } = entity.getPermissions(user);

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
        const getNewPermissions = (itemFile: Type.FSEntity) => {
          const flags = itemFile.parsePermissions();

          permissions
            .substr(2)
            .split('')
            .forEach((item: string) => {
              const permSeg = Utils.getPermissionSegmentByString(
                flags,
                userType
              );
              const value = Utils.getPermissionSegmentValueByString(
                permSeg,
                item
              );

              if (value) {
                Utils.setPermissionSegmentValueByString(
                  permSeg,
                  item,
                  operator === '+'
                );
              }
            });

          return flags;
        };

        entity.permissions = Utils.transformFlagsToPermissions(
          getNewPermissions(entity)
        );

        if (isRecursive && entity instanceof Folder) {
          entity.traverseChildren((item: Type.FSEntity) => {
            const { w } = item.getPermissions(user);

            if (w) {
              item.permissions = Utils.transformFlagsToPermissions(
                getNewPermissions(item)
              );
            }
          }, true);
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

        const { r } = entity.getPermissions(user);

        if (!r) {
          return Promise.resolve(new CustomString('No read permissions'));
        }

        const path = args.get('path').toString();
        const newName = args.get('newName').toString();
        const traversalPath = Utils.getTraversalPath(path, entity.getPath());
        const folder = entity.getEntity(traversalPath) as Type.Folder;

        if (folder && folder.isFolder) {
          const { w } = folder.getPermissions(user);

          if (!w) {
            return Promise.resolve(new CustomString('No write permissions'));
          }

          const result = folder.getEntityIndex(newName);

          if (result) {
            folder.removeEntity(newName);
          }

          if (entity.isFolder) {
            const newFolder = entity.copyEntity(folder) as Type.Folder;
            newFolder.name = newName;
            folder.folders.push(newFolder);
          } else {
            const newFile = entity.copyEntity(folder) as Type.File;
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

        const { r } = entity.getPermissions(user);

        if (!r) {
          return Promise.resolve(new CustomString('No read permissions'));
        }

        const path = args.get('path').toString();
        const newName = args.get('newName').toString();
        const traversalPath = Utils.getTraversalPath(path, entity.getPath());
        const folder = entity.getEntity(traversalPath) as Type.Folder;

        if (folder && folder.isFolder) {
          const { w } = folder.getPermissions(user);

          if (!w) {
            return Promise.resolve(new CustomString('No write permissions'));
          }

          const result = folder.getEntityIndex(newName);

          if (result) {
            folder.removeEntity(newName);
          }

          if (entity.isFolder) {
            const newFolder = entity.copyEntity(folder) as Type.Folder;
            newFolder.name = newName;
            folder.folders.push(newFolder);
          } else {
            const newFile = entity.copyEntity(folder) as Type.File;
            newFile.name = newName;
            folder.files.push(newFile);
          }

          (entity.parent as Type.Folder).removeEntity(entity.name);

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

        const { w } = entity.getPermissions(user);

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
          new CustomString('/' + entity.getPath().join('/'))
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
        if (entity instanceof Type.File) {
          return Promise.resolve(new CustomBoolean(entity.allowImport));
        }
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

        const { r } = entity.getPermissions(user);

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

        const { w } = entity.getPermissions(user);

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
        return Promise.resolve(
          new CustomBoolean(file.type !== Type.FileType.Plain)
        );
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
        const permissionMap = entity.getPermissions(user);

        return Promise.resolve(
          new CustomBoolean(
            Utils.getPermissionSegmentValueByString(permissionMap, permission)
          )
        );
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

        const { w } = entity.getPermissions(user);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        (entity.parent as Type.Folder).removeEntity(entity.name);

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

        const result = (entity as Type.Folder).folders.map(
          (folder: Type.Folder) => {
            return create(user, folder);
          }
        );

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

        const { w } = entity.getPermissions(user);

        if (!w) {
          return Promise.resolve(new CustomString('No write permissions'));
        }

        const owner = args.get('owner').toString();
        const isRecursive = args.get('isRecursive').toTruthy();

        if (isRecursive && entity instanceof Folder) {
          entity.traverseChildren((item: Type.FSEntity) => {
            const { w } = item.getPermissions(user);

            if (w) {
              item.owner = owner;
            }
          }, true);
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
