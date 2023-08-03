import {
  CustomFunction,
  CustomMap,
  CustomString,
  CustomValue,
  Path
} from 'greybel-interpreter';

export default class GreyMap extends CustomMap {
  constructor(customIntrinsics: CustomFunction[]) {
    super();
    customIntrinsics.forEach((item) =>
      this.value.set(new CustomString(item.name), item)
    );
  }

  set(_path: Path<CustomValue> | CustomValue, _newValue: CustomValue) {
    throw new Error('Cannot set property on an interface.');
  }
}
