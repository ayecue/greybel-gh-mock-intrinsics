import { CustomString, ObjectValue } from 'greybel-interpreter';

import generics from './generics';
import create, { GHMockIntrinsicEnv } from './mock/environment';

const s = (v: string) => new CustomString(v);

export function getAPI(
  mockEnvironment?: GHMockIntrinsicEnv
): ObjectValue {
  const apiInterface = new ObjectValue();
  const intrinsics = generics(mockEnvironment || create());

  apiInterface.set(s('typeof'), intrinsics.typeOf);
  apiInterface.set(s('user_input'), intrinsics.userInput);
  apiInterface.set(s('get_shell'), intrinsics.getShell);
  apiInterface.set(s('mail_login'), intrinsics.mailLogin);
  apiInterface.set(s('get_router'), intrinsics.getRouter);
  apiInterface.set(s('get_switch'), intrinsics.getSwitch);
  apiInterface.set(s('include_lib'), intrinsics.includeLib);
  apiInterface.set(s('md5'), intrinsics.md5);
  apiInterface.set(s('time'), intrinsics.time);
  apiInterface.set(s('nslookup'), intrinsics.nslookup);
  apiInterface.set(s('whois'), intrinsics.whois);
  apiInterface.set(s('is_valid_ip'), intrinsics.isValidIp);
  apiInterface.set(s('is_lan_ip'), intrinsics.isLanIp);
  apiInterface.set(s('command_info'), intrinsics.commandInfo);
  apiInterface.set(s('current_date'), intrinsics.currentDate);
  apiInterface.set(s('current_path'), intrinsics.currentPath);
  apiInterface.set(s('parent_path'), intrinsics.parentPath);
  apiInterface.set(s('home_dir'), intrinsics.homeDir);
  apiInterface.set(s('program_path'), intrinsics.programPath);
  apiInterface.set(s('active_user'), intrinsics.activeUser);
  apiInterface.set(s('user_mail_address'), intrinsics.userMailAddress);
  apiInterface.set(s('user_bank_number'), intrinsics.userBankNumber);
  apiInterface.set(s('format_columns'), intrinsics.formatColumns);
  apiInterface.set(s('user_input'), intrinsics.userInput);
  apiInterface.set(s('clear_screen'), intrinsics.clearScreen);
  apiInterface.set(s('launch_path'), intrinsics.launchPath);
  apiInterface.set(s('get_custom_object'), intrinsics.getCustomObject);

  return apiInterface;
}

export function init(
  customAPI: ObjectValue = new ObjectValue(),
  mockEnvironment?: GHMockIntrinsicEnv
) {
  const apiInterface = getAPI(mockEnvironment);
  const api: ObjectValue = new ObjectValue(apiInterface);

  api.extend(customAPI);

  return api;
}

export { GHMockIntrinsicEnv } from './mock/environment';
