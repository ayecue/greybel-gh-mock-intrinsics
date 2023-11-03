import { CustomString, ObjectValue } from 'greybel-interpreter';

import generics from './generics';
import { createGHMockEnv, GHMockIntrinsicEnv } from './mock/environment';
import { build, connectService, hostComputer, launch, ping, scp, startTerminal } from './shell';
import { deleteMail, fetchMail, readMail, sendMail } from './meta-mail';
import { activeNetCard, changePassword, closeProgram, connectEthernet, connectWifi, createFolder, createGroup, createUser, deleteGroup, deleteUser, getFile, getLanIp, getName, getNetworkDevices, getPorts, getPublicIpPc, groups, isNetworkActive, networkGateway, showProcs, touch, wifiNetworks } from './computer';

const s = (v: string) => new CustomString(v);

export function getAPI(mockEnvironment?: GHMockIntrinsicEnv): ObjectValue {
  const apiInterface = new ObjectValue();
  const intrinsics = generics(mockEnvironment || createGHMockEnv());

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
  apiInterface.set(s('get_ctf'), intrinsics.getCTF);

  //shell
  apiInterface.set(s('connect_service'), connectService);
  apiInterface.set(s('start_terminal'), startTerminal);
  apiInterface.set(s('scp'), scp);
  apiInterface.set(s('build'), build);
  apiInterface.set(s('launch'), launch);
  apiInterface.set(s('host_computer'), hostComputer);
  apiInterface.set(s('ping'), ping);

  //computer
  apiInterface.set(s('get_ports'), getPorts);
  apiInterface.set(s('File'), getFile);
  apiInterface.set(s('create_folder'), createFolder);
  apiInterface.set(s('is_network_active'), isNetworkActive);
  apiInterface.set(s('lan_ip'), getLanIp);
  apiInterface.set(s('public_ip_pc'), getPublicIpPc);
  apiInterface.set(s('touch'), touch);
  apiInterface.set(s('show_procs'), showProcs);
  apiInterface.set(s('network_devices'), getNetworkDevices);
  apiInterface.set(s('change_password'), changePassword);
  apiInterface.set(s('create_user'), createUser);
  apiInterface.set(s('delete_user'), deleteUser);
  apiInterface.set(s('create_group'), createGroup);
  apiInterface.set(s('delete_group'), deleteGroup);
  apiInterface.set(s('groups'), groups);
  apiInterface.set(s('close_program'), closeProgram);
  apiInterface.set(s('wifi_networks'), wifiNetworks);
  apiInterface.set(s('connect_wifi'), connectWifi);
  apiInterface.set(s('connect_ethernet'), connectEthernet);
  apiInterface.set(s('active_net_card'), activeNetCard);
  apiInterface.set(s('network_gateway'), networkGateway);
  apiInterface.set(s('get_name'), getName);

  //metaMail
  apiInterface.set(s('fetch'), fetchMail);
  apiInterface.set(s('read'), readMail);
  apiInterface.set(s('send'), sendMail);
  apiInterface.set(s('delete_mail'), deleteMail);

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

export { createGHMockEnv, GHMockIntrinsicEnv } from './mock/environment';
export { KeyCode } from './utils';
