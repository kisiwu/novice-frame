import { ResponseShape } from './ResponseShape';
import {
  BaseResponseUtil,
  GroupResponseUtil,
  OpenAPIResponseObject as ResponseObject,
  ReferenceObject,
} from '@novice1/api-doc-generator';
import extend from 'extend';

export class GroupResponseShape extends GroupResponseUtil {
  constructor(responseUtils: BaseResponseUtil[]) {
    super(responseUtils);
    this.responseUtils = responseUtils;
  }
  toOpenAPIRefPreferred(): Record<string, ResponseObject | ReferenceObject> {
    let r: Record<string, ResponseObject | ReferenceObject> = {};
    this.responseUtils.forEach((builder) => {
      if (builder instanceof ResponseShape) {
        r = extend(r, builder.toOpenAPIRefPreferred());
      } else {
        r = extend(r, builder.toOpenAPI());
      }
    });
    return r;
  }
}
