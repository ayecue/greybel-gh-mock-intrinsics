import { CustomFunction } from 'greybel-interpreter';
import { MockEnvironment } from 'greybel-mock-environment';

import generics from './generics';
import create from './mock/environment';

export function getAPI(
  mockEnvironment?: MockEnvironment
): Map<string, CustomFunction> {
  const apiInterface = new Map();
  const intrinsics = generics(mockEnvironment || create());

  apiInterface.set('typeof', intrinsics.typeOf);
  apiInterface.set('user_input', intrinsics.userInput);
  apiInterface.set('get_shell', intrinsics.getShell);
  apiInterface.set('mail_login', intrinsics.mailLogin);
  apiInterface.set('get_router', intrinsics.getRouter);
  apiInterface.set('get_switch', intrinsics.getSwitch);
  apiInterface.set('include_lib', intrinsics.includeLib);
  apiInterface.set('md5', intrinsics.md5);
  apiInterface.set('time', intrinsics.time);
  apiInterface.set('nslookup', intrinsics.nslookup);
  apiInterface.set('whois', intrinsics.whois);
  apiInterface.set('is_valid_ip', intrinsics.isValidIp);
  apiInterface.set('is_lan_ip', intrinsics.isLanIp);
  apiInterface.set('command_info', intrinsics.commandInfo);
  apiInterface.set('current_date', intrinsics.currentDate);
  apiInterface.set('current_path', intrinsics.currentPath);
  apiInterface.set('parent_path', intrinsics.parentPath);
  apiInterface.set('home_dir', intrinsics.homeDir);
  apiInterface.set('program_path', intrinsics.programPath);
  apiInterface.set('active_user', intrinsics.activeUser);
  apiInterface.set('user_mail_address', intrinsics.userMailAddress);
  apiInterface.set('user_bank_number', intrinsics.userBankNumber);
  apiInterface.set('format_columns', intrinsics.formatColumns);
  apiInterface.set('user_input', intrinsics.userInput);
  apiInterface.set('clear_screen', intrinsics.clearScreen);
  apiInterface.set('launch_path', intrinsics.launchPath);

  return apiInterface;
}

export function init(
  customAPI: Map<string, CustomFunction> = new Map(),
  mockEnvironment?: MockEnvironment
) {
  const apiInterface = getAPI(mockEnvironment);
  const api: Map<string, CustomFunction> = new Map([
    ...Array.from(apiInterface.entries()),
    ...Array.from(customAPI.entries())
  ]);

  return api;
}
