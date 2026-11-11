import { ResponseShape } from './ResponseShape';
import {
  ContextResponseUtil,
  IOpenAPIResponseContext,
  OpenAPIResponseObject as ResponseObject,
  ReferenceObject,
} from '@novice1/api-doc-generator';

export class ContextResponseShape extends ContextResponseUtil {
  toOpenAPI(): Record<string, ResponseObject | ReferenceObject> {
    const ctxt: IOpenAPIResponseContext = {};
    if (this.code) {
      ctxt.code = this.code;
    }
    if (this.ref) {
      ctxt.ref = this.ref;
    }
    if (this.links) {
      ctxt.links = this.links;
    }
    if (this.default) {
      ctxt.default = this.default;
    }
    if (this.responseUtil instanceof ResponseShape) {
      return this.responseUtil.toOpenAPIRefPreferred(ctxt);
    } else {
      return this.responseUtil.toOpenAPI(ctxt);
    }
  }
}
