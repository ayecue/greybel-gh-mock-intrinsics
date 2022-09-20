import md5 from 'blueimp-md5';
import { KeyEvent } from 'greybel-interpreter';
import { Type } from 'greybel-mock-environment';

export interface PermissionSegment {
  x: boolean;
  w: boolean;
  r: boolean;
}

export interface PermissionMap {
  u: PermissionSegment;
  g: PermissionSegment;
  o: PermissionSegment;
}

export function getPermissionSegmentValueByString(flag: PermissionSegment, flagType: string): boolean {
  switch (flagType) {
    case 'x':
      return flag.x;
    case 'w':
      return flag.w;
    case 'r':
      return flag.r;
    default:
      throw new Error('Invalid permission flag type.');
  }
}

export function setPermissionSegmentValueByString(flag: PermissionSegment, flagType: string, value: boolean): void {
  switch (flagType) {
    case 'x': {
      flag.x = value;
      break;
    }
    case 'w': {
      flag.w = value;
      break;
    }
    case 'r': {
      flag.r = value;
      break;
    }
    default:
      throw new Error('Invalid permission flag type.');
  }
}

export function getPermissionSegmentByString(flag: PermissionMap, userType: string): PermissionSegment {
  switch (userType) {
    case 'u':
      return flag.u;
    case 'g':
      return flag.g;
    case 'o':
      return flag.o;
    default:
      throw new Error('Invalid permission user type.');
  }
}

export function transformFlagsToPermissions(
  permissionMap: PermissionMap
): string {
  const segments = [
    permissionMap.u,
    permissionMap.g,
    permissionMap.o
  ].map((map: PermissionSegment) => {
    return `${map.r ? 'r' : '-'}${map.w ? 'w' : '-'}${map.x ? 'x' : '-'}`;
  });

  return segments.join('');
}

export function parsePermissions(file: Type.FSEntity): PermissionMap {
  const permSegments = file.permissions.substr(1).match(/.{1,3}/g);

  if (permSegments.length !== 3) {
    throw Error('Invalid permissions.');
  }

  const [u, g, o] = permSegments;

  return {
    u: {
      r: u[0] !== '-',
      w: u[1] !== '-',
      x: u[2] !== '-'
    },
    g: {
      r: g[0] !== '-',
      w: g[1] !== '-',
      x: g[2] !== '-'
    },
    o: {
      r: o[0] !== '-',
      w: o[1] !== '-',
      x: o[2] !== '-'
    }
  };
}

export function getPermissions(
  user: Type.User,
  file: Type.FSEntity
): PermissionSegment {
  // g is ignored for now
  // todo: add group logic
  const parsedPermissions = parsePermissions(file);

  if (file.owner === user.username) {
    return parsedPermissions.u;
  }

  return parsedPermissions.o;
}

export function getFile(
  entity: Type.FSEntity,
  path: string[]
): Type.FSEntity | null {
  if (!path || !entity.isFolder) {
    return null;
  }

  if (path.length === 0) {
    return entity;
  }

  const nextPath = [].concat(path);
  const currentSegment = nextPath.shift();
  const folder = entity as Type.Folder;
  const nextEntity: Type.FSEntity =
    folder.files.find((item: Type.File) => item.name === currentSegment) ||
    folder.folders.find((item: Type.Folder) => item.name === currentSegment);

  if (!nextEntity) {
    return null;
  }

  if (nextPath.length === 0) {
    return nextEntity;
  }

  return getFile(nextEntity, nextPath);
}

export function hasFile(folder: Type.Folder, fileName: string): boolean {
  return !!getFileIndex(folder, fileName);
}

export function getFileIndex(
  folder: Type.Folder,
  fileName: string
): { isFolder: boolean; index: number } {
  const fileIndex = folder.files.findIndex(
    (item: Type.File) => item.name === fileName
  );

  if (fileIndex !== -1 && fileIndex !== undefined) {
    return {
      isFolder: false,
      index: fileIndex
    };
  }

  const folderIndex = folder.folders.findIndex(
    (item: Type.Folder) => item.name === fileName
  );

  if (folderIndex !== -1 && folderIndex !== undefined) {
    return {
      isFolder: true,
      index: folderIndex
    };
  }

  return null;
}

export function putFile(folder: Type.Folder, file: Type.File): void {
  removeFile(folder, file.name);
  file.parent = folder;
  folder.files.push(file);
}

export function removeFile(folder: Type.Folder, fileName: string): boolean {
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

  traverseChildren(entity, (item: Type.FSEntity) => {
    item.deleted = true;
  });

  return true;
}

export function traverseChildren(
  entity: Type.FSEntity,
  callback: (v: Type.FSEntity) => void,
  skip?: boolean
): void {
  if (!entity.isFolder) {
    return;
  }

  const folder = entity as Type.Folder;

  if (!skip) {
    callback(entity);
  }

  folder.files.forEach((item: Type.File) => callback(item));
  folder.folders.forEach((item: Type.Folder) =>
    traverseChildren(item, callback)
  );
}

export function copyFile(
  entity: Type.FSEntity,
  parent: Type.FSEntity
): Type.FSEntity {
  const newEntity: Type.FSEntity = {
    name: entity.name,
    permissions: entity.permissions,
    owner: entity.owner,
    isFolder: entity.isFolder,
    parent
  };

  if (entity.isFolder) {
    const folder = entity as Type.Folder;
    const newFolder = newEntity as Type.Folder;

    newFolder.files = folder.files.map(
      (item: Type.File) => copyFile(item, newFolder) as Type.File
    );
    newFolder.folders = folder.folders.map(
      (item: Type.Folder) => copyFile(item, newFolder) as Type.Folder
    );

    return newFolder;
  }

  const file = entity as Type.File;
  const newFile = newEntity as Type.File;

  newFile.content = file.content;
  newFile.type = file.type;

  return newFile;
}

export function getHomePath(
  user: Type.User,
  computer: Type.Computer
): string[] | null {
  let path;

  switch (user.username) {
    case 'root':
      path = '/root';
      break;
    case 'guest':
      path = '/home/guest';
      break;
    default:
      path = '/home/' + user.username;
  }

  const traversalPath = getTraversalPath(path, []);
  const folder = getFile(computer.fileSystem, traversalPath);
  return folder ? traversalPath : null;
}

export function getFilePath(entity: Type.FSEntity): string[] | null {
  const path = [entity.name];
  let current = entity.parent;

  while (current && current.name !== '') {
    path.unshift(current.name);
    current = current.parent;
  }

  return path;
}

export function getTraversalPath(
  path: string | null,
  currentLocation: string[] | null
): null | string[] {
  if (!path) {
    return null;
  } else if (path === '/') {
    return [];
  }

  path = path.replace(/\/+$/i, '');

  if (path.startsWith('/')) {
    return path.substr(1).split('/');
  }

  if (currentLocation) {
    return currentLocation.concat(path.split('/'));
  }

  return path.split('/');
}

export function getFileLibrary(file: Type.File): Type.Library | null {
  switch (file.type) {
    case Type.FileType.AptClient:
      return Type.Library.APT;
    case Type.FileType.Crypto:
      return Type.Library.CRYPTO;
    case Type.FileType.Init:
      return Type.Library.INIT;
    case Type.FileType.KernelModule:
      return Type.Library.KERNEL_MODULE;
    case Type.FileType.Metaxploit:
      return Type.Library.METAXPLOIT;
    case Type.FileType.Net:
      return Type.Library.NET;
    default:
  }

  return null;
}

export function getServiceLibrary(service: Type.Service): Type.Library | null {
  switch (service) {
    case Type.Service.FTP:
      return Type.Library.FTP;
    case Type.Service.HTTP:
      return Type.Library.HTTP;
    case Type.Service.RSHELL:
      return Type.Library.RSHELL;
    case Type.Service.SMTP:
      return Type.Library.SMTP;
    case Type.Service.SQL:
      return Type.Library.SQL;
    case Type.Service.SSH:
      return Type.Library.SSH;
    default:
  }

  return null;
}

export function getUserByVulnerability(
  vulActionUser: Type.VulnerabilityActionUser,
  computer: Type.Computer
): Type.User {
  switch (vulActionUser) {
    case Type.VulnerabilityActionUser.NORMAL:
      return computer.users[1];
    case Type.VulnerabilityActionUser.ROOT:
      return computer.users[0];
    default:
  }

  return {
    username: 'guest',
    password: '',
    passwordHashed: '',
    email: '',
    bankNumber: ''
  };
}

export function changePassword(
  computer: Type.Computer,
  username: string,
  password: string
): boolean {
  const user = computer.users.find((item: Type.User) => {
    return item.username === username && item.password === password;
  });

  if (user) {
    user.password = password;
    user.passwordHashed = md5(password);
    return true;
  }

  return false;
}

export enum KeyCode {
  Enter = 13,
  LeftArrow = 37,
  UpArrow = 38,
  RightArrow = 39,
  DownArrow = 40,
  Insert = 45,
  Home = 36,
  End = 35,
  PageDown = 34,
  PageUp = 33,
  Backspace = 8,
  Delete = 46,
  Tab = 9,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,
  Escape = 27,
  Space = 32,
  Shift = 16,
  Control = 17,
  Alt = 18
}

export function keyEventToString(keyEvent: KeyEvent): string {
  switch (keyEvent.keyCode) {
    case KeyCode.LeftArrow:
    case KeyCode.UpArrow:
    case KeyCode.RightArrow:
    case KeyCode.DownArrow:
    case KeyCode.Insert:
    case KeyCode.Home:
    case KeyCode.End:
    case KeyCode.PageDown:
    case KeyCode.PageUp:
    case KeyCode.Backspace:
    case KeyCode.Delete:
    case KeyCode.Tab:
    case KeyCode.F1:
    case KeyCode.F2:
    case KeyCode.F3:
    case KeyCode.F4:
    case KeyCode.F5:
    case KeyCode.F6:
    case KeyCode.F7:
    case KeyCode.F8:
    case KeyCode.F9:
    case KeyCode.F10:
    case KeyCode.F11:
    case KeyCode.F12:
    case KeyCode.Escape:
      return KeyCode[keyEvent.keyCode];
    case KeyCode.Enter:
      return '\n';
    case KeyCode.Space:
      return ' ';
    case KeyCode.Shift: {
      if (keyEvent.code === 'ShiftLeft') {
        return 'LeftShift';
      }
      return 'RightShift';
    }
    case KeyCode.Control: {
      if (keyEvent.code === 'ControlLeft') {
        return 'LeftControl';
      }
      return 'RightControl';
    }
    case KeyCode.Alt: {
      if (keyEvent.code === 'AltLeft') {
        return 'LeftAlt';
      }
      return 'RightAlt';
    }
    default:
      return String.fromCharCode(keyEvent.keyCode).toLowerCase();
  }
}
