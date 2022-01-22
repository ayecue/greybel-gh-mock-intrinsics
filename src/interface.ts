import {
	CustomMap,
	CustomNil
} from 'greybel-interpreter';
import crypto from 'crypto';

export default class BasicInterface extends CustomMap {
	interface: Map<string, Function>;

	constructor(type: string, itrface: Map<string, Function>) {
		super();
		const me = this;

		me.value.set('classID', type);
		me.interface = itrface;
	}

	[Symbol.iterator](): null {
		return null;
	}

	extend(value: Map<string, any>): null {
		return null;
	}

	set(path: string[], value: any): Promise<void> {
		return Promise.reject('You cannot set a property on an interface.');
	}

	get(path: string[]): Promise<any> {
		const me = this;

		if (path.length === 0) {
			return Promise.resolve(me);
		}

		const traversalPath = [].concat(path);
		const current = traversalPath.shift();
		const currentValue = current.valueOf();

		if (currentValue != null) {
			if (path.length === 1 && me.interface.has(currentValue)) {
				return Promise.resolve(
					me.interface.get(currentValue).bind(null, me)
				);
			} else {
				throw new Error(`Cannot get path ${path.join('.')}`);
			}
		}
		
		return null;
	}

	getCallable(path: string[]): Promise<any> {
		const me = this;
		const traversalPath = [].concat(path);
		const current = traversalPath.shift();
		const currentValue = current.valueOf();

		if (currentValue != null) {
			if (path.length === 1 && me.interface.has(currentValue)) {
				return Promise.resolve({
					origin: me.interface.get(currentValue).bind(null, me),
					context: me
				});
			} else {
				throw new Error(`Cannot get path ${path.join('.')}`);
			}
		}
		
		return null;
	}

	callMethod(method: string[], ...args: any[]): any {
		if (method.length === 0) {
			throw new Error('Unexpected method length');
		}

		const me = this;
		const key = method[0].valueOf();

		if (!me.interface.has(key)) {
			throw new Error(`Cannot access ${key} in map`);
		}

		return me.interface.get(key)(me, ...args);
	}

	createInstance(): null {
		return null;
	}

	toString(): string {
		return this.getType();
	}

	fork(): BasicInterface {
		const me = this;
		return new BasicInterface(me.value.get('classID'), me.interface);
	}
}