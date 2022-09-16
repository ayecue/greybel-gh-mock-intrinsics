import {
  CustomBoolean,
  CustomFunction,
  CustomNumber,
  CustomString,
  CustomValue,
  OperationContext
} from 'greybel-interpreter';

import BasicInterface from './interface';
import { Type } from 'greybel-mock-environment';

export function create(computer: Type.Computer, port: Type.Port): BasicInterface {
  const itrface = new BasicInterface('port');

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'get_lan_ip',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomString(computer.localIp));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'is_closed',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomBoolean(port.isClosed));
      }
    )
  );

  itrface.addMethod(
    CustomFunction.createExternalWithSelf(
      'is_closed',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        _args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        return Promise.resolve(new CustomNumber(port.port));
      }
    )
  );

  itrface.setVariable('port', port.port);
  itrface.setVariable('isClosed', port.isClosed);
  itrface.setVariable('service', port.service);
  itrface.setVariable('forwarded', port.forwarded);

  return itrface;
}
