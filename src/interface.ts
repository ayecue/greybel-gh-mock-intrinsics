import { CustomFunction, CustomInterface } from 'greybel-interpreter';

export default class BasicInterface extends CustomInterface {
  values: Map<string, any>;

  constructor(type: string, values?: Map<string, any>) {
    super(type);
    this.values = new Map<string, any>(values);
  }

  addMethod(fn: CustomFunction): BasicInterface {
    this.addFunction(fn.name, fn);
    return this;
  }

  setVariable(key: string, value: any): BasicInterface {
    this.values.set(key, value);
    return this;
  }

  getVariable(key: string): any {
    return this.values.get(key);
  }
}
