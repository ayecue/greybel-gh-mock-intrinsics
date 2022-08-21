export interface User {
  username: string;
  password: string;
  passwordHashed: string;
  email: string;
  userBankNumber: string;
}

export enum Service {
  SSH = 'ssh',
  FTP = 'ftp',
  SMTP = 'smtp',
  SQL = 'sql',
  RSHELL = 'rshell',
  HTTP = 'http'
}

export const ServiceList = [
  Service.SSH,
  Service.FTP,
  Service.SMTP,
  Service.SQL,
  Service.RSHELL,
  Service.HTTP
];

export interface Port {
  port: number;
  isClosed: boolean;
  service: Service;
  forwarded: boolean;
}

export interface EMail {
  email: string;
  password: string;
  messages: Map<string, { subject: string; message: string }>;
}

export interface NetworkDevice {
  type: string;
  id: string;
  active: boolean;
}

export interface Computer {
  /* eslint-disable no-use-before-define */
  router?: Router;
  localIp: string;
  activeNetCard: string;
  networkDevices: NetworkDevice[];
  users: User[];
  /* eslint-disable no-use-before-define */
  fileSystem: Folder;
  ports?: Port[];
}

export interface Router extends Computer {
  publicIp: string;
  domain: string;
  whoisDescription: string;
}

export interface Network {
  bssid: string;
  essid: string;
  password: string;
  router: Router;
  mac: string;
  percentage: number;
  name: string;
}

export interface RouterNamespace {
  name: string;
  router: Router;
}

export enum FileType {
  Plain,
  Bin,
  Exe,
  Crypto,
  Metaxploit,
  System,
  AptClient,
  Ack,
  Net,
  Init,
  KernelModule,
  Blockchain,
  SSH,
  FTP,
  HTTP,
  Chat,
  RShell,
  Repository
}

export interface FileSystemEntity {
  parent?: FileSystemEntity;
  name: string;
  permissions: string;
  owner: string;
  isFolder?: boolean;
  isProtected?: boolean;
  deleted?: boolean;
}

export interface File extends FileSystemEntity {
  content?: string;
  type: FileType;
}

export interface Folder extends FileSystemEntity {
  files: File[];
  folders: Folder[];
}

export enum Library {
  SSH = 'ssh',
  FTP = 'ftp',
  HTTP = 'http',
  SQL = 'sql',
  SMTP = 'smtp',
  CHAT = 'chat',
  CAM = 'cam',
  RSHELL = 'rshell',
  KERNEL_ROUTER = 'kernel_router',
  APT = 'apt',
  METAXPLOIT = 'metaxploit',
  CRYPTO = 'crypto',
  KERNEL_MODULE = 'kernel_module',
  INIT = 'init',
  NET = 'net'
}

export enum VulnerabilityRequirements {
  LIBRARY,
  REGISTER_AMOUNT,
  ANY_ACTIVE,
  ROOT_ACTIVE,
  LOCAL,
  FORWARD,
  GATEWAY
}

export const VulnerabilityRequirementList = [
  VulnerabilityRequirements.LIBRARY,
  VulnerabilityRequirements.REGISTER_AMOUNT,
  VulnerabilityRequirements.ANY_ACTIVE,
  VulnerabilityRequirements.ROOT_ACTIVE,
  VulnerabilityRequirements.LOCAL,
  VulnerabilityRequirements.FORWARD,
  VulnerabilityRequirements.GATEWAY
];

export enum VulnerabilityAction {
  SHELL,
  FOLDER,
  PASSWORD,
  COMPUTER,
  FIREWALL
}

export const VulnerabilityActionList = [
  VulnerabilityAction.SHELL,
  VulnerabilityAction.FOLDER,
  VulnerabilityAction.PASSWORD,
  VulnerabilityAction.COMPUTER,
  VulnerabilityAction.FIREWALL
];

export enum VulnerabilityActionUser {
  GUEST,
  NORMAL,
  ROOT
}

export interface Vulnerability {
  required: VulnerabilityRequirements[];
  sector: string;
  details: string;
  remote?: boolean;
  library: Library;
  action: VulnerabilityAction;
  user: VulnerabilityActionUser;
  folder: string[];
  memAddress: string;
}

export interface MockData {}
