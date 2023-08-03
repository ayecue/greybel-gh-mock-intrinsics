import {
  CustomMap,
  CustomString,
  CustomValue,
  Path
} from 'greybel-interpreter';

export const CLASS_ID_PROPERTY = new CustomString('classID');

const hasOwnProperty = Object.prototype.hasOwnProperty;

export default class BasicInterface extends CustomMap {
  variables: Record<string, any>;

  constructor(type: string, isa: CustomMap) {
    super(null, isa);
    this.variables = {};
    this.value.set(CLASS_ID_PROPERTY, new CustomString(type));
  }

  set(_path: Path<CustomValue> | CustomValue, _newValue: CustomValue) {
    throw new Error('Cannot set property on an interface.');
  }

  setVariable<T extends any>(key: string, value: T): BasicInterface {
    this.variables[key] = value;
    return this;
  }

  getVariable<T extends any>(key: string): T {
    if (hasOwnProperty.call(this.variables, key)) {
      return this.variables[key];
    }
    return null;
  }

  toString(): string {
    return this.getCustomType();
  }
}
