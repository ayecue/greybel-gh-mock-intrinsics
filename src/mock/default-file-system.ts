import { File, FileSystemEntity, FileType, Folder, User } from '../types';

function getEtcAptFiles(parent: FileSystemEntity): File[] {
  return [
    {
      name: 'sources.txt',
      permissions: '-rw-r-----',
      owner: 'root',
      content: `{
			"official_server": true,
			"sourceList": {}
		}`,
      type: FileType.Plain,
      parent
    }
  ];
}

function getEtcAptFolder(parent: FileSystemEntity): Folder {
  const aptFolder: Folder = {
    name: 'apt',
    permissions: 'drwxr-x---',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  aptFolder.files = getEtcAptFiles(aptFolder);

  return aptFolder;
}

function getEtcFiles(parent: FileSystemEntity, users: User[]): File[] {
  return [
    {
      name: 'passwd',
      permissions: '-rw-r-----',
      owner: 'root',
      content: users.map((v) => `${v.username}:${v.passwordHashed}`).join('\n'),
      type: FileType.Plain,
      parent
    },
    {
      name: 'xorg.conf',
      permissions: '-rw-r-----',
      owner: 'root',
      content: ``,
      type: FileType.Plain,
      parent
    },
    {
      name: 'fstab',
      permissions: '-rw-r-----',
      owner: 'root',
      content: ``,
      type: FileType.Plain,
      parent
    }
  ];
}

function getEtcFolder(parent: FileSystemEntity, users: User[]): Folder {
  const etcFolder: Folder = {
    name: 'etc',
    permissions: 'drwxr-x---',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  etcFolder.folders = [getEtcAptFolder(etcFolder)];

  etcFolder.files = getEtcFiles(etcFolder, users);

  return etcFolder;
}

function getLibFiles(parent: FileSystemEntity): File[] {
  return [
    {
      name: 'init.so',
      permissions: '-rw-r-----',
      owner: 'root',
      type: FileType.Init,
      parent
    },
    {
      name: 'kernel_module.so',
      permissions: '-rw-r-----',
      owner: 'root',
      type: FileType.KernelModule,
      parent
    },
    {
      name: 'net.so',
      permissions: '-rw-r-----',
      owner: 'root',
      type: FileType.Net,
      parent
    },
    {
      name: 'aptclient.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.AptClient,
      parent
    },
    {
      name: 'crypto.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.Crypto,
      parent
    },
    {
      name: 'metaxploit.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.Metaxploit,
      parent
    },
    {
      name: 'blockchain.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.Blockchain,
      parent
    },
    {
      name: 'ssh.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.SSH,
      parent
    },
    {
      name: 'ftp.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.FTP,
      parent
    },
    {
      name: 'http.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.HTTP,
      parent
    },
    {
      name: 'chat.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.Chat,
      parent
    },
    {
      name: 'rshell.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.RShell,
      parent
    },
    {
      name: 'repository.so',
      permissions: '-rw-r--r--',
      owner: 'root',
      type: FileType.Repository,
      parent
    },
  ];
}

function getLibFolder(parent: FileSystemEntity): Folder {
  const libFolder: Folder = {
    name: 'lib',
    permissions: 'drwxrwx---',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  libFolder.files = getLibFiles(libFolder);

  return libFolder;
}

function getSysFiles(parent: FileSystemEntity): File[] {
  return [
    {
      name: 'xorg.sys',
      permissions: '-r-x------',
      owner: 'root',
      type: FileType.System,
      parent
    },
    {
      name: 'config.sys',
      permissions: '-rw-------',
      owner: 'root',
      type: FileType.System,
      parent
    },
    {
      name: 'network.cfg',
      permissions: '-rw-------',
      owner: 'root',
      type: FileType.System,
      parent
    }
  ];
}

function getSysFolder(parent: FileSystemEntity): Folder {
  const sysFolder: Folder = {
    name: 'sys',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  sysFolder.files = getSysFiles(sysFolder);

  return sysFolder;
}

function getDefaultHomeFolders(
  parent: FileSystemEntity,
  owner: string,
  permissions: string
): Folder[] {
  return [
    {
      name: 'Desktop',
      permissions,
      owner,
      isFolder: true,
      folders: [],
      files: [],
      parent
    },
    {
      name: 'Downloads',
      permissions,
      owner,
      isFolder: true,
      folders: [],
      files: [],
      parent
    },
    {
      name: 'Config',
      permissions,
      owner,
      isFolder: true,
      folders: [],
      files: [],
      parent
    },
    {
      name: '.Trash',
      permissions,
      owner,
      isFolder: true,
      folders: [],
      files: [],
      parent
    }
  ];
}

function getRootFolder(parent: FileSystemEntity): Folder {
  const rootFolder: Folder = {
    name: 'root',
    permissions: 'drwxr-----',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  rootFolder.folders = getDefaultHomeFolders(rootFolder, 'root', 'drwxrwx---');

  return rootFolder;
}

export function getUserFolder(parent: FileSystemEntity, user: string): Folder {
  const userFolder: Folder = {
    name: user,
    permissions: 'drwxr-----',
    owner: user,
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  userFolder.folders = getDefaultHomeFolders(userFolder, user, 'drwxrwx---');

  return userFolder;
}

function getGuestFolder(parent: FileSystemEntity): Folder {
  const guestFolder: Folder = {
    name: 'guest',
    permissions: 'drwxrwxrwx',
    owner: 'guest',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  guestFolder.folders = getDefaultHomeFolders(
    guestFolder,
    'guest',
    'drwxrwxrwx'
  );

  return guestFolder;
}

function getHomeFolder(parent: FileSystemEntity, users: User[]): Folder {
  const homeFolder: Folder = {
    name: 'home',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  homeFolder.folders = [
    ...users
      .filter((v: User) => v.username !== 'root')
      .map((v: User) => getUserFolder(homeFolder, v.username)),
    getGuestFolder(homeFolder)
  ];

  return homeFolder;
}

function getVarFolder(parent: FileSystemEntity): Folder {
  return {
    name: 'var',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };
}

function getBinFolder(parent: FileSystemEntity): Folder {
  return {
    name: 'bin',
    permissions: 'drwxrwxr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };
}

function getUsrBinFolder(parent: FileSystemEntity): Folder {
  return {
    name: 'bin',
    permissions: 'drwxrwxr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };
}

function getUsrFolder(parent: FileSystemEntity): Folder {
  const usrFolder: Folder = {
    name: 'usr',
    permissions: 'drwxrwxr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  usrFolder.folders = [getUsrBinFolder(usrFolder)];

  return usrFolder;
}

function getBootFiles(parent: FileSystemEntity): File[] {
  return [
    {
      name: 'System.map',
      permissions: '-rw-------',
      owner: 'root',
      type: FileType.System,
      parent
    },
    {
      name: 'inittrd.img',
      permissions: '-r--------',
      owner: 'root',
      type: FileType.System,
      parent
    },
    {
      name: 'kernel.img',
      permissions: '-r--------',
      owner: 'root',
      type: FileType.System,
      parent
    }
  ];
}

function getBootFolder(parent: FileSystemEntity): Folder {
  const bootFolder: Folder = {
    name: 'sys',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    isFolder: true,
    folders: [],
    files: [],
    parent
  };

  bootFolder.files = getBootFiles(bootFolder);

  return bootFolder;
}

export default function getDefaultFileSystem(users: User[]): Folder {
  const defaultSystem: Folder = {
    name: '',
    permissions: 'drwxr--r--',
    owner: 'root',
    isFolder: true,
    isProtected: true,
    files: [],
    folders: []
  };

  defaultSystem.folders = [
    getEtcFolder(defaultSystem, users),
    getLibFolder(defaultSystem),
    getSysFolder(defaultSystem),
    getRootFolder(defaultSystem),
    getHomeFolder(defaultSystem, users),
    getVarFolder(defaultSystem),
    getBinFolder(defaultSystem),
    getUsrFolder(defaultSystem),
    getBootFolder(defaultSystem)
  ];

  return defaultSystem;
}
