import * as generics from './generics';

export function getAPI(): Map<string, Function> {
	const apiInterface = new Map();

	apiInterface.set('typeof', generics.typeOf);
	apiInterface.set('get_shell', generics.getShell);
	apiInterface.set('mail_login', generics.mailLogin);
	apiInterface.set('get_router', generics.getRouter);
	apiInterface.set('get_switch', generics.getSwitch);
	apiInterface.set('include_lib', generics.includeLib);
	apiInterface.set('md5', generics.md5);
	apiInterface.set('time', generics.time);
	apiInterface.set('nslookup', generics.nslookup);
	apiInterface.set('whois', generics.whois);
	apiInterface.set('is_valid_ip', generics.isValidIp);
	apiInterface.set('is_lan_ip', generics.isLanIp);
	apiInterface.set('command_info', generics.commandInfo);
	apiInterface.set('current_date', generics.currentDate);
	apiInterface.set('current_path', generics.currentPath);
	apiInterface.set('parent_path', generics.parentPath);
	apiInterface.set('home_dir', generics.homeDir);
	apiInterface.set('program_path', generics.programPath);
	apiInterface.set('active_user', generics.activeUser);
	apiInterface.set('user_mail_address', generics.userMailAddress);
	apiInterface.set('user_bank_number', generics.userBankNumber);
	apiInterface.set('format_columns', generics.formatColumns);
	apiInterface.set('user_input', generics.userInput);
	apiInterface.set('clear_screen', generics.clearScreen);
	apiInterface.set('launch_path', generics.launchPath);

	return apiInterface;
}

export function init(customAPI: Map<string, Function> = new Map()) {
	const apiInterface = getAPI();
	const api: Map<string, Function> = new Map([
		...Array.from(apiInterface.entries()),
		...Array.from(customAPI.entries())
	]);

	return api;
}