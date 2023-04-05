import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  Defaults,
  OperationContext
} from 'greybel-interpreter';
import { MockEnvironment, Type, Utils } from 'greybel-mock-environment';

import BasicInterface from './interface';
import {
  greaterThanContentLimit,
  greaterThanEntityNameLimit,
  greaterThanFileNameLimit,
  isValidFileName
} from './utils';

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  entity: Type.FSEntity
): BasicInterface {
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

        const permissions = args.get('permissions');
        const isRecursive = args.get('isRecursive');

        if (
          permissions instanceof CustomNil ||
          isRecursive instanceof CustomNil
        ) {
          throw new Error('chmod: Invalid arguments');
        }

        const { w } = entity.getPermissions(user, device.groups);

        if (user.username !== 'root' && !w) {
          return Promise.resolve(new CustomString('permission denied'));
        } else if (entity.isProtected) {
          return Promise.resolve(
            new CustomString('permission denied. File protected.')
          );
        }

        const permissionsRaw = permissions.toString();
        const isRecursiveRaw = isRecursive.toTruthy();

        if (!/^[ugo](-|\+)[wrx]{1,3}$/i.test(permissionsRaw)) {
          return Promise.resolve(new CustomString('Wrong format.'));
        }

        entity.permissions.chmod(permissionsRaw);

        if (isRecursiveRaw && entity instanceof Type.Folder) {
          entity.traverseChildren((item: Type.FSEntity) => {
            const { w } = item.getPermissions(user, device.groups);

            if (w) {
              item.permissions.chmod(permissionsRaw);
            }
          });
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

        const path = args.get('path');
        const newName = args.get('newName');

        if (path instanceof CustomNil || newName instanceof CustomNil) {
          throw new Error('copy: Invalid arguments');
        }

        const pathRaw = path.toString();
        const newNameRaw = newName.toString();

        if (!isValidFileName(newNameRaw)) {
          return Promise.resolve(
            new CustomString('Error: only alphanumeric allowed as newname')
          );
        } else if (greaterThanFileNameLimit(newNameRaw)) {
          throw new Error('copy: name cannot exceed the 128 character limit.');
        }

        const { r } = entity.getPermissions(user, device.groups);

        if (!r && user.username !== 'root') {
          return Promise.resolve(new CustomString('permission denied'));
        }

        const traversalPath = Utils.getTraversalPath(
          pathRaw,
          entity.getTraversalPath()
        );
        const folder = device.getFile(traversalPath);

        if (folder instanceof Type.Folder) {
          const { w } = folder.getPermissions(user, device.groups);

          if (!w && user.username !== 'root') {
            return Promise.resolve(new CustomString('permission denied'));
          }

          const copy = entity.copy();

          copy.name = newNameRaw;

          folder.putEntity(copy);

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
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

        const path = args.get('path');
        const newName = args.get('newName');

        if (path instanceof CustomNil || newName instanceof CustomNil) {
          throw new Error('move: Invalid arguments');
        }

        const pathRaw = path.toString();
        const newNameRaw = newName.toString();

        if (!isValidFileName(newNameRaw)) {
          return Promise.resolve(
            new CustomString('Error: only alphanumeric allowed as newname')
          );
        } else if (greaterThanFileNameLimit(newNameRaw)) {
          throw new Error('move: name cannot exceed the 128 character limit.');
        }

        const { r } = entity.getPermissions(user, device.groups);

        if (!r && user.username !== 'root') {
          return Promise.resolve(new CustomString('permission denied'));
        }

        const traversalPath = Utils.getTraversalPath(
          pathRaw,
          entity.getTraversalPath()
        );
        const folder = device.getFile(traversalPath);

        if (folder instanceof Type.Folder) {
          const { w } = folder.getPermissions(user, device.groups);

          if (!w && user.username !== 'root') {
            return Promise.resolve(new CustomString('permission denied'));
          }

          const copy = entity.copy();

          copy.name = newNameRaw;
          folder.putEntity(copy);

          return Promise.resolve(Defaults.True);
        }

        return Promise.resolve(Defaults.Void);
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

        const newName = args.get('newName');

        if (newName instanceof CustomNil) {
          return Promise.resolve(Defaults.False);
        }

        const newNameRaw = newName.toString();

        if (!isValidFileName(newNameRaw)) {
          return Promise.resolve(
            new CustomString('Error: only alphanumeric allowed as newname')
          );
        } else if (greaterThanFileNameLimit(newNameRaw)) {
          throw new Error('move: name cannot exceed the 128 character limit.');
        }

        const { w } = entity.getPermissions(user, device.groups);

        if (!w && user.username !== 'root') {
          return Promise.resolve(new CustomString('permission denied'));
        } else if (entity.isProtected) {
          return Promise.resolve(
            new CustomString('permission denied. File protected.')
          );
        }

        entity.name = newNameRaw;

        return Promise.resolve(Defaults.True);
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

        return Promise.resolve(new CustomString(entity.getPath()));
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

        return Promise.resolve(
          create(mockEnvironment, user, device, entity.parent)
        );
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

        if (entity instanceof Type.Folder) {
          return Promise.resolve(
            Defaults.Void
          );
        }

        const { r } = entity.getPermissions(user, device.groups);

        if (!r && user.username !== 'root') {
          return Promise.resolve(Defaults.Void);
        }

        if (
          entity instanceof Type.File &&
          entity.type === Type.FileType.Source
        ) {
          return Promise.resolve(new CustomString(entity.content || ''));
        }

        return Promise.resolve(Defaults.Void);
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

        const content = args.get('content');

        if (content instanceof CustomNil) {
          return Promise.resolve(Defaults.False);
        }

        const contentRaw = content.toString();

        if (greaterThanContentLimit(contentRaw)) {
          return Promise.resolve(
            new CustomString(
              "I can't save the file. The maximum of 160,000 characters has been exceeded"
            )
          );
        }

        if (entity instanceof Type.Folder) {
          return Promise.resolve(
            new CustomString(`can't open ${entity.getPath()} Binary file.`)
          );
        } else if (
          entity instanceof Type.File &&
          entity.type !== Type.FileType.Source
        ) {
          return Promise.resolve(
            new CustomString(`can't open ${entity.getPath()} Binary file.`)
          );
        }

        const { w } = entity.getPermissions(user, device.groups);

        if (!w && user.username !== 'root') {
          return Promise.resolve(new CustomString('permission denied'));
        }

        const file = entity as Type.File;

        file.content = contentRaw;

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
        if (entity instanceof Type.Folder) {
          return Promise.resolve(Defaults.True);
        }

        const file = entity as Type.File;
        return Promise.resolve(
          new CustomBoolean(file.type !== Type.FileType.Source)
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
        return Promise.resolve(
          new CustomBoolean(entity instanceof Type.Folder)
        );
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
        const permissionMap = entity.getPermissions(user, device.groups);

        return Promise.resolve(
          new CustomBoolean(permissionMap.getFlagByString(permission))
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

        const { w } = entity.getPermissions(user, device.groups);

        if (!w && user.username !== 'root') {
          return Promise.resolve(new CustomString('permission denied'));
        } else if (entity.isProtected) {
          return Promise.resolve(
            new CustomString('permission denied. File protected.')
          );
        }

        entity.delete();

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

        if (!(entity instanceof Type.Folder)) {
          return Promise.resolve(Defaults.Void);
        }

        const result = Array.from((entity as Type.Folder).folders.values()).map(
          (folder: Type.Folder) => {
            return create(mockEnvironment, user, device, folder);
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

        if (!(entity instanceof Type.Folder)) {
          return Promise.resolve(Defaults.Void);
        }

        const result = Array.from((entity as Type.Folder).files.values()).map(
          (file: Type.File) => {
            return create(mockEnvironment, user, device, file);
          }
        );

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
        return Promise.resolve(new CustomString(entity.permissions.toString()));
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

        const owner = args.get('owner');
        const isRecursive = args.get('isRecursive');

        if (owner instanceof CustomNil || isRecursive instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const ownerRaw = owner.toString();
        const isRecursiveRaw = isRecursive.toTruthy();

        if (ownerRaw === '') {
          throw new Error('invalid owner value.');
        } else if (greaterThanEntityNameLimit(ownerRaw)) {
          throw new Error('owner cannot exceed the 15 character limit.');
        }

        const { w } = entity.getPermissions(user, device.groups);

        if (!w && user.username !== 'root') {
          return Promise.resolve(new CustomString('Permission denied'));
        }

        entity.owner = ownerRaw;

        if (isRecursiveRaw && entity instanceof Type.Folder) {
          entity.traverseChildren((item: Type.FSEntity) => {
            const { w } = item.getPermissions(user, device.groups);

            if (w) {
              item.owner = ownerRaw;
            }
          });
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
        return Promise.resolve(new CustomString(entity.group));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'set_group',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        if (entity.deleted) {
          return Promise.resolve(Defaults.Void);
        }

        const group = args.get('group');
        const isRecursive = args.get('isRecursive');

        if (group instanceof CustomNil || isRecursive instanceof CustomNil) {
          return Promise.resolve(Defaults.Void);
        }

        const groupRaw = group.toString();
        const isRecursiveRaw = isRecursive.toTruthy();

        if (groupRaw === '') {
          throw new Error('invalid groupname.');
        } else if (greaterThanEntityNameLimit(groupRaw)) {
          throw new Error('groupname cannot exceed the 15 character limit.');
        }

        const { w } = entity.getPermissions(user, device.groups);

        if (!w && user.username !== 'root') {
          return Promise.resolve(new CustomString('Permission denied'));
        }

        entity.group = groupRaw;

        if (isRecursiveRaw && entity instanceof Type.Folder) {
          entity.traverseChildren((item: Type.FSEntity) => {
            const { w } = item.getPermissions(user, device.groups);

            if (w) {
              item.group = groupRaw;
            }
          });
        }

        return Promise.resolve(new CustomString(''));
      }
    )
      .addArgument('group')
      .addArgument('isRecursive', new CustomBoolean(false))
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'size',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(entity.getSize().toString()));
      }
    )
  );

  return itrface;
}
