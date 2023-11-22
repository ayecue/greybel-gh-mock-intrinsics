import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomNil,
  CustomString,
  CustomValue,
  DefaultType,
  VM
} from 'greybel-interpreter';
import { MockEnvironment, Type, Utils } from 'greybel-mock-environment';

import GreyMap from './grey-map';
import BasicInterface from './interface';
import {
  greaterThanContentLimit,
  greaterThanEntityNameLimit,
  greaterThanFileNameLimit,
  isValidFileName
} from './utils';

export const chmod = CustomFunction.createExternalWithSelf(
  'chmod',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const permissions = args.get('permissions');
    const isRecursive = args.get('isRecursive');

    if (
      permissions instanceof CustomNil ||
      isRecursive instanceof CustomNil
    ) {
      throw new Error('chmod: Invalid arguments');
    }

    const { w } = entity.getPermissionsForUser(user, device.groups);

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
        const { w } = item.getPermissionsForUser(user, device.groups);

        if (w) {
          item.permissions.chmod(permissionsRaw);
        }
      });
    }

    return Promise.resolve(new CustomString(''));
  }
)
  .addArgument('permissions')
  .addArgument('isRecursive', new CustomBoolean(false));

export const copy = CustomFunction.createExternalWithSelf(
  'copy',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
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

    const { r } = entity.getPermissionsForUser(user, device.groups);

    if (!r && user.username !== 'root') {
      return Promise.resolve(new CustomString('permission denied'));
    }

    const traversalPath = Utils.getTraversalPath(
      pathRaw,
      entity.getTraversalPath()
    );
    const folder = device.getFile(traversalPath);

    if (folder instanceof Type.Folder) {
      const { w } = folder.getPermissionsForUser(user, device.groups);

      if (!w && user.username !== 'root') {
        return Promise.resolve(new CustomString('permission denied'));
      }

      const copy = entity.copy();

      copy.name = newNameRaw;

      folder.putEntity(copy);

      return Promise.resolve(DefaultType.True);
    }

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('path')
  .addArgument('newName');

export const move = CustomFunction.createExternalWithSelf(
  'move',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
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

    const { r } = entity.getPermissionsForUser(user, device.groups);

    if (!r && user.username !== 'root') {
      return Promise.resolve(new CustomString('permission denied'));
    }

    const traversalPath = Utils.getTraversalPath(
      pathRaw,
      entity.getTraversalPath()
    );
    const folder = device.getFile(traversalPath);

    if (folder instanceof Type.Folder) {
      const { w } = folder.getPermissionsForUser(user, device.groups);

      if (!w && user.username !== 'root') {
        return Promise.resolve(new CustomString('permission denied'));
      }

      const copy = entity.copy();

      copy.name = newNameRaw;
      folder.putEntity(copy);

      return Promise.resolve(DefaultType.True);
    }

    return Promise.resolve(DefaultType.Void);
  }
)
  .addArgument('path')
  .addArgument('newName');

export const rename = CustomFunction.createExternalWithSelf(
  'rename',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const newName = args.get('newName');

    if (newName instanceof CustomNil) {
      return Promise.resolve(DefaultType.False);
    }

    const newNameRaw = newName.toString();

    if (!isValidFileName(newNameRaw)) {
      return Promise.resolve(
        new CustomString('Error: only alphanumeric allowed as newname')
      );
    } else if (greaterThanFileNameLimit(newNameRaw)) {
      throw new Error('move: name cannot exceed the 128 character limit.');
    }

    const { w } = entity.getPermissionsForUser(user, device.groups);

    if (!w && user.username !== 'root') {
      return Promise.resolve(new CustomString('permission denied'));
    } else if (entity.isProtected) {
      return Promise.resolve(
        new CustomString('permission denied. File protected.')
      );
    }

    entity.name = newNameRaw;

    return Promise.resolve(DefaultType.True);
  }
).addArgument('newName');

export const path = CustomFunction.createExternalWithSelf(
  'path',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(new CustomString(entity.getPath()));
  }
);

export const allowImport = CustomFunction.createExternalWithSelf(
  'allow_import',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;

    if (entity instanceof Type.File) {
      return Promise.resolve(new CustomBoolean(entity.allowImport));
    }
    return Promise.resolve(DefaultType.False);
  }
);

export const parent = CustomFunction.createExternalWithSelf(
  'parent',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device, mockEnvironment } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    if (entity.name === '') {
      return Promise.resolve(DefaultType.Void);
    }

    return Promise.resolve(
      create(mockEnvironment, user, device, entity.parent)
    );
  }
);

export const name = CustomFunction.createExternalWithSelf(
  'name',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;

    if (entity.getPath() === '/' && entity.name === '') {
      return Promise.resolve(new CustomString('/'));
    }

    return Promise.resolve(new CustomString(entity.name));
  }
);

export const getContent = CustomFunction.createExternalWithSelf(
  'get_content',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    if (entity instanceof Type.Folder) {
      return Promise.resolve(DefaultType.Void);
    }

    const { r } = entity.getPermissionsForUser(user, device.groups);

    if (!r && user.username !== 'root') {
      return Promise.resolve(DefaultType.Void);
    }

    if (
      entity instanceof Type.File &&
      entity.type === Type.FileType.Source
    ) {
      return Promise.resolve(new CustomString(entity.content || ''));
    }

    return Promise.resolve(DefaultType.Void);
  }
);

export const setContent = CustomFunction.createExternalWithSelf(
  'set_content',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const content = args.get('content');

    if (content instanceof CustomNil) {
      return Promise.resolve(DefaultType.False);
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

    const { w } = entity.getPermissionsForUser(user, device.groups);

    if (!w && user.username !== 'root') {
      return Promise.resolve(new CustomString('permission denied'));
    }

    const file = entity as Type.File;

    file.content = contentRaw;

    return Promise.resolve(DefaultType.True);
  }
).addArgument('content');

export const isBinary = CustomFunction.createExternalWithSelf(
  'is_binary',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;

    if (entity instanceof Type.Folder) {
      return Promise.resolve(DefaultType.True);
    }

    const file = entity as Type.File;
    return Promise.resolve(
      new CustomBoolean(file.type !== Type.FileType.Source)
    );
  }
);

export const isFolder = CustomFunction.createExternalWithSelf(
  'is_folder',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;
    return Promise.resolve(
      new CustomBoolean(entity instanceof Type.Folder)
    );
  }
);

export const hasPermission = CustomFunction.createExternalWithSelf(
  'has_permission',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;
    const permission = args.get('permission').toString().substr(0, 1);
    const permissionMap = entity.getPermissionsForUser(user, device.groups);

    return Promise.resolve(
      new CustomBoolean(permissionMap.getFlagByString(permission))
    );
  }
).addArgument('permission');

export const deleteFile = CustomFunction.createExternalWithSelf(
  'delete',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const { w } = entity.getPermissionsForUser(user, device.groups);

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
);

export const getFolders = CustomFunction.createExternalWithSelf(
  'get_folders',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device, mockEnvironment } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    if (!(entity instanceof Type.Folder)) {
      return Promise.resolve(DefaultType.Void);
    }

    const result = Array.from((entity as Type.Folder).folders.values()).map(
      (folder: Type.Folder) => {
        return create(mockEnvironment, user, device, folder);
      }
    );

    return Promise.resolve(new CustomList(result));
  }
);

export const getFiles = CustomFunction.createExternalWithSelf(
  'get_files',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device, mockEnvironment } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    if (!(entity instanceof Type.Folder)) {
      return Promise.resolve(DefaultType.Void);
    }

    const result = Array.from((entity as Type.Folder).files.values()).map(
      (file: Type.File) => {
        return create(mockEnvironment, user, device, file);
      }
    );

    return Promise.resolve(new CustomList(result));
  }
);

export const permissions = CustomFunction.createExternalWithSelf(
  'permissions',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;
    return Promise.resolve(new CustomString(entity.getPermissions()));
  }
);

export const owner = CustomFunction.createExternalWithSelf(
  'owner',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;
    return Promise.resolve(new CustomString(entity.owner));
  }
);

export const setOwner = CustomFunction.createExternalWithSelf(
  'set_owner',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const owner = args.get('owner');
    const isRecursive = args.get('isRecursive');

    if (owner instanceof CustomNil || isRecursive instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    const ownerRaw = owner.toString();
    const isRecursiveRaw = isRecursive.toTruthy();

    if (ownerRaw === '') {
      throw new Error('invalid owner value.');
    } else if (greaterThanEntityNameLimit(ownerRaw)) {
      throw new Error('owner cannot exceed the 15 character limit.');
    }

    const { w } = entity.getPermissionsForUser(user, device.groups);

    if (!w && user.username !== 'root') {
      return Promise.resolve(new CustomString('Permission denied'));
    }

    entity.owner = ownerRaw;

    if (isRecursiveRaw && entity instanceof Type.Folder) {
      entity.traverseChildren((item: Type.FSEntity) => {
        const { w } = item.getPermissionsForUser(user, device.groups);

        if (w) {
          item.owner = ownerRaw;
        }
      });
    }

    return Promise.resolve(new CustomString(''));
  }
)
  .addArgument('owner')
  .addArgument('isRecursive', new CustomBoolean(false));

export const group = CustomFunction.createExternalWithSelf(
  'group',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;
    return Promise.resolve(new CustomString(entity.group));
  }
);

export const setGroup = CustomFunction.createExternalWithSelf(
  'set_group',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity, user, device } = self.variables;

    if (entity.deleted) {
      return Promise.resolve(DefaultType.Void);
    }

    const group = args.get('group');
    const isRecursive = args.get('isRecursive');

    if (group instanceof CustomNil || isRecursive instanceof CustomNil) {
      return Promise.resolve(DefaultType.Void);
    }

    const groupRaw = group.toString();
    const isRecursiveRaw = isRecursive.toTruthy();

    if (groupRaw === '') {
      throw new Error('invalid groupname.');
    } else if (greaterThanEntityNameLimit(groupRaw)) {
      throw new Error('groupname cannot exceed the 15 character limit.');
    }

    const { w } = entity.getPermissionsForUser(user, device.groups);

    if (!w && user.username !== 'root') {
      return Promise.resolve(new CustomString('Permission denied'));
    }

    entity.group = groupRaw;

    if (isRecursiveRaw && entity instanceof Type.Folder) {
      entity.traverseChildren((item: Type.FSEntity) => {
        const { w } = item.getPermissionsForUser(user, device.groups);

        if (w) {
          item.group = groupRaw;
        }
      });
    }

    return Promise.resolve(new CustomString(''));
  }
)
  .addArgument('group')
  .addArgument('isRecursive', new CustomBoolean(false));

export const size = CustomFunction.createExternalWithSelf(
  'size',
  (
    _vm: VM,
    _self: CustomValue,
    args: Map<string, CustomValue>
  ): Promise<CustomValue> => {
    const self = File.retreive(args);

    if (self === null) {
      return Promise.resolve(DefaultType.Void);
    }

    const { entity } = self.variables;
    return Promise.resolve(new CustomString(entity.getSize().toString()));
  }
);

export interface FileVariables {
  mockEnvironment: MockEnvironment;
  device: Type.Device;
  user: Type.User;
  entity: Type.FSEntity;
}

export class File extends BasicInterface {
  static readonly type: string = 'file';
  static readonly isa: GreyMap = new GreyMap([
    chmod,
    copy,
    move,
    rename,
    path,
    allowImport,
    parent,
    name,
    getContent,
    setContent,
    isBinary,
    isFolder,
    hasPermission,
    deleteFile,
    getFolders,
    getFiles,
    permissions,
    owner,
    setOwner,
    group,
    setGroup,
    size
  ]);

  static retreive(args: Map<string, CustomValue>): File | null {
    const intf = args.get('self');
    if (intf instanceof File) {
      return intf;
    }
    return null;
  }

  variables: FileVariables;

  constructor(variables: FileVariables) {
    super(File.type, File.isa);
    this.variables = variables;
  }
}

export function create(
  mockEnvironment: MockEnvironment,
  user: Type.User,
  device: Type.Device,
  entity: Type.FSEntity
): BasicInterface {
  const itrface = new File({
    mockEnvironment,
    user,
    device,
    entity
  });

  return itrface;
}
