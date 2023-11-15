import {
  CustomMap,
  CustomString,
  CustomValue,
  Path
} from 'greybel-interpreter';

export const ISA_PROPERTY = new CustomString('__isa');
export const CLASS_ID_PROPERTY = new CustomString('classID');

const hasOwnProperty = Object.prototype.hasOwnProperty;

export default class BasicInterface extends CustomMap {
  variables: Record<string, any>;

  constructor(type: string, isa: CustomMap) {
    super(null);
    this.variables = {};
    this.value.set(ISA_PROPERTY, isa);
    this.value.set(CLASS_ID_PROPERTY, new CustomString(type));
  }

  getCustomType(): string {
    return this.value.get(CLASS_ID_PROPERTY)?.toString() ?? super.getCustomType();
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
}
