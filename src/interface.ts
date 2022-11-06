import {
  CustomFunction,
  CustomMap,
  CustomString,
  CustomValue,
  Path
} from 'greybel-interpreter';

export const CLASS_ID_PROPERTY = new CustomString('classID');

export default class BasicInterface extends CustomMap {
  variables: Map<string, any>;

  constructor(type: string, values?: Map<string, any>) {
    super(null, new CustomMap());
    this.variables = new Map<string, any>(values);
    this.value.set(CLASS_ID_PROPERTY, new CustomString(type));
  }

  set(_path: Path<CustomValue> | CustomValue, _newValue: CustomValue) {
    throw new Error('Cannot set property on an interface.');
  }

  addMethod(fn: CustomFunction): BasicInterface {
    this.isa.set(new CustomString(fn.name), fn);
    return this;
  }

  setVariable(key: string, value: any): BasicInterface {
    this.variables.set(key, value);
    return this;
  }

  getVariable(key: string): any {
    return this.variables.get(key);
  }

  toString(): string {
    return this.getCustomType();
  }
}
