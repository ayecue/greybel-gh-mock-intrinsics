import { CustomString, ObjectValue } from 'greybel-interpreter';

import generics from './generics';
import { createGHMockEnv, GHMockIntrinsicEnv } from './mock/environment';
import { build, connectService, hostComputer, launch, ping, scp, startTerminal } from './shell';
import { deleteMail, fetchMail, readMail, sendMail } from './meta-mail';
import { activeNetCard, changePassword, closeProgram, connectEthernet, connectWifi, createFolder, createGroup, createUser, deleteGroup, deleteUser, getFile, getLanIp, getName, getNetworkDevices, getPorts, getPublicIpPc, groups, isNetworkActive, networkGateway, showProcs, touch, wifiNetworks } from './computer';
import { allowImport, chmod, copy, deleteFile, getContent, getFiles, getFolders, group, hasPermission, isBinary, isFolder, move, name, owner, parent, path, permissions, rename, setContent, setGroup, setOwner, size } from './file';
import { bssidName, devicePorts, devicesLanIp, essidName, firewallRules, kernelVersion, localIp, pingPort, portInfo, publicIp, usedPorts } from './router';
import { placeholderIntrinsic } from './utils';
import { createWallet, getCoin, loginWallet } from './blockchain';
import { getSubwallet, getSubwallets } from './coin';
import { libName, overflow, version } from './meta-lib';
import { load, netUse, rshellClient, rshellServer, scan, scanAddress, sniffer } from './metaxploit';
import { dumpLib, getNumConnGateway, getNumPortforward, getNumUsers, isAnyActiveUser, isRootActiveUser } from './net-session';
import { isClosed, portNumber } from './port';
import { installService, startService, stopService } from './service';
import { aircrack, aireplay, airmon, decipher, smtpUserList } from './crypto';

const s = (v: string) => new CustomString(v);

export function getAPI(mockEnvironment: GHMockIntrinsicEnv): ObjectValue {
  const apiInterface = new ObjectValue();
  const intrinsics = generics(mockEnvironment);

  apiInterface.set(s('typeof'), intrinsics.typeOf);
  apiInterface.set(s('user_input'), intrinsics.userInput);
  apiInterface.set(s('get_shell'), intrinsics.getShell);
  apiInterface.set(s('mail_login'), intrinsics.mailLogin);
  apiInterface.set(s('get_router'), intrinsics.getRouter);
  apiInterface.set(s('get_switch'), intrinsics.getSwitch);
  apiInterface.set(s('include_lib'), intrinsics.includeLib);
  apiInterface.set(s('md5'), intrinsics.md5);
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

  //file
  apiInterface.set(s('copy'), copy);
  apiInterface.set(s('move'), move);
  apiInterface.set(s('rename'), rename);
  apiInterface.set(s('path'), path);
  apiInterface.set(s('parent'), parent);
  apiInterface.set(s('name'), name);
  apiInterface.set(s('is_folder'), isFolder);
  apiInterface.set(s('get_content'), getContent);
  apiInterface.set(s('set_content'), setContent);
  apiInterface.set(s('is_binary'), isBinary);
  apiInterface.set(s('has_permission'), hasPermission);
  apiInterface.set(s('delete'), deleteFile);
  apiInterface.set(s('get_folders'), getFolders);
  apiInterface.set(s('get_files'), getFiles);
  apiInterface.set(s('chmod'), chmod);
  apiInterface.set(s('permissions'), permissions);
  apiInterface.set(s('owner'), owner);
  apiInterface.set(s('set_owner'), setOwner);
  apiInterface.set(s('group'), group);
  apiInterface.set(s('set_group'), setGroup);
  apiInterface.set(s('size'), size);
  apiInterface.set(s('allow_import'), allowImport);

  //router
  apiInterface.set(s('public_ip'), publicIp);
  apiInterface.set(s('local_ip'), localIp);
  apiInterface.set(s('ping_port'), pingPort);
  apiInterface.set(s('port_info'), portInfo);
  apiInterface.set(s('used_ports'), usedPorts);
  apiInterface.set(s('device_ports'), devicePorts);
  apiInterface.set(s('devices_lan_ip'), devicesLanIp);
  apiInterface.set(s('essid_name'), essidName);
  apiInterface.set(s('bssid_name'), bssidName);
  apiInterface.set(s('kernel_version'), kernelVersion);
  apiInterface.set(s('firewall_rules'), firewallRules);

  //crypto
  apiInterface.set(s('decipher'), decipher);
  apiInterface.set(s('aircrack'), aircrack);
  apiInterface.set(s('airmon'), airmon);
  apiInterface.set(s('aireplay'), aireplay);
  apiInterface.set(s('smtp_user_list'), smtpUserList);

  //metaLib
  apiInterface.set(s('overflow'), overflow);
  apiInterface.set(s('lib_name'), libName);
  apiInterface.set(s('version'), version);

  //metaMail
  apiInterface.set(s('fetch'), fetchMail);
  apiInterface.set(s('read'), readMail);
  apiInterface.set(s('send'), sendMail);
  apiInterface.set(s('delete_mail'), deleteMail);

  //metaxploit
  apiInterface.set(s('load'), load);
  apiInterface.set(s('net_use'), netUse);
  apiInterface.set(s('scan'), scan);
  apiInterface.set(s('scan_address'), scanAddress);
  apiInterface.set(s('sniffer'), sniffer);
  apiInterface.set(s('rshell_client'), rshellClient);
  apiInterface.set(s('rshell_server'), rshellServer);

  //netSession
  apiInterface.set(s('dump_lib'), dumpLib);
  apiInterface.set(s('get_num_users'), getNumUsers);
  apiInterface.set(s('get_num_portforward'), getNumPortforward);
  apiInterface.set(s('get_num_conn_gateway'), getNumConnGateway);
  apiInterface.set(s('is_any_active_user'), isAnyActiveUser);
  apiInterface.set(s('is_root_active_user'), isRootActiveUser);

  //port
  apiInterface.set(s('get_lan_ip'), getLanIp);
  apiInterface.set(s('is_closed'), isClosed);
  apiInterface.set(s('port_number'), portNumber);

  //service
  apiInterface.set(s('install_service'), installService);
  apiInterface.set(s('start_service'), startService);
  apiInterface.set(s('stop_service'), stopService);

  //aptClient
  apiInterface.set(s('show'), placeholderIntrinsic.forkAs('show'));
  apiInterface.set(s('search'), placeholderIntrinsic.forkAs('search'));
  apiInterface.set(s('update'), placeholderIntrinsic.forkAs('update'));
  apiInterface.set(s('add_repo'), placeholderIntrinsic.forkAs('add_repo'));
  apiInterface.set(s('del_repo'), placeholderIntrinsic.forkAs('del_repo'));
  apiInterface.set(s('install'), placeholderIntrinsic.forkAs('install'));
  apiInterface.set(s('check_upgrade'), placeholderIntrinsic.forkAs('check_upgrade'));

  //blockchain
  apiInterface.set(s('get_coin'), getCoin);
  apiInterface.set(s('login_wallet'), loginWallet);
  apiInterface.set(s('create_wallet'), createWallet);
  apiInterface.set(s('coin_price'), placeholderIntrinsic.forkAs('coin_price'));
  apiInterface.set(s('show_history'), placeholderIntrinsic.forkAs('show_history'));
  apiInterface.set(s('amount_mined'), placeholderIntrinsic.forkAs('amount_mined'));
  apiInterface.set(s('delete_coin'), placeholderIntrinsic.forkAs('delete_coin'));

  //coin
  apiInterface.set(s('get_subwallet'), getSubwallet);
  apiInterface.set(s('get_subwallets'), getSubwallets);
  apiInterface.set(s('set_cycle_mining'), placeholderIntrinsic.forkAs('set_cycle_mining'));
  apiInterface.set(s('get_cycle_mining'), placeholderIntrinsic.forkAs('get_cycle_mining'));
  apiInterface.set(s('get_reward'), placeholderIntrinsic.forkAs('get_reward'));
  apiInterface.set(s('set_reward'), placeholderIntrinsic.forkAs('set_reward'));
  apiInterface.set(s('transaction'), placeholderIntrinsic.forkAs('transaction'));
  apiInterface.set(s('create_subwallet'), placeholderIntrinsic.forkAs('create_subwallet'));
  apiInterface.set(s('set_address'), placeholderIntrinsic.forkAs('set_address'));
  apiInterface.set(s('get_address'), placeholderIntrinsic.forkAs('get_address'));
  apiInterface.set(s('get_mined_coins'), placeholderIntrinsic.forkAs('get_mined_coins'));

  //subWallet
  apiInterface.set(s('get_balance_subwallet'), placeholderIntrinsic.forkAs('get_balance_subwallet'));
  apiInterface.set(s('set_info'), placeholderIntrinsic.forkAs('set_info'));
  apiInterface.set(s('buy_coin'), placeholderIntrinsic.forkAs('buy_coin'));
  apiInterface.set(s('get_info'), placeholderIntrinsic.forkAs('get_info'));
  apiInterface.set(s('delete_subwallet'), placeholderIntrinsic.forkAs('delete_subwallet'));
  apiInterface.set(s('get_user'), placeholderIntrinsic.forkAs('get_user'));
  apiInterface.set(s('last_transaction'), placeholderIntrinsic.forkAs('last_transaction'));
  apiInterface.set(s('list_global_coins'), placeholderIntrinsic.forkAs('list_global_coins'));
  apiInterface.set(s('mining'), placeholderIntrinsic.forkAs('mining'));
  apiInterface.set(s('check_password'), placeholderIntrinsic.forkAs('check_password'));
  apiInterface.set(s('wallet_username'), placeholderIntrinsic.forkAs('wallet_username'));

  //wallet
  apiInterface.set(s('list_coins'), placeholderIntrinsic.forkAs('list_coins'));
  apiInterface.set(s('get_balance'), placeholderIntrinsic.forkAs('get_balance'));
  apiInterface.set(s('buy_coin'), placeholderIntrinsic.forkAs('buy_coin'));
  apiInterface.set(s('sell_coin'), placeholderIntrinsic.forkAs('sell_coin'));
  apiInterface.set(s('get_pending_trade'), placeholderIntrinsic.forkAs('get_pending_trade'));
  apiInterface.set(s('cancel_pending_trade'), placeholderIntrinsic.forkAs('cancel_pending_trade'));
  apiInterface.set(s('get_global_offers'), placeholderIntrinsic.forkAs('get_global_offers'));
  apiInterface.set(s('list_global_coins'), placeholderIntrinsic.forkAs('list_global_coins'));
  apiInterface.set(s('show_nodes'), placeholderIntrinsic.forkAs('show_nodes'));
  apiInterface.set(s('reset_password'), placeholderIntrinsic.forkAs('reset_password'));
  apiInterface.set(s('get_pin'), placeholderIntrinsic.forkAs('get_pin'));

  return apiInterface;
}

export function init(
  customAPI: ObjectValue = new ObjectValue(),
  mockEnvironment: GHMockIntrinsicEnv
) {
  const apiInterface = getAPI(mockEnvironment);
  const api: ObjectValue = new ObjectValue(apiInterface);

  api.extend(customAPI);

  return api;
}

export { createGHMockEnv, GHMockIntrinsicEnv } from './mock/environment';
export { KeyCode } from './utils';
