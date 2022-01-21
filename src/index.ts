import {
	Interpreter,
	CustomString,
	CustomList,
	CustomMap
} from 'greybel-interpreter';

export function getAPI(): Map<string, Function> {
	const apiInterface = new Map();

	return apiInterface;
}

export function init(interpreter: Interpreter, customAPI: Map<string, Function> = new Map()) {
	const apiInterface = getAPI();
	const api: Map<string, Function> = new Map([
		...Array.from(apiInterface.entries()),
		...Array.from(customAPI.entries())
	]);

	

	return api;
}