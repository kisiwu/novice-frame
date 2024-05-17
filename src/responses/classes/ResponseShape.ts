import { IOpenAPIResponseContext, ResponseUtil } from '@novice1/api-doc-generator';
import { ResponseObject, ReferenceObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';

export class ResponseShape extends ResponseUtil {
    toOpenAPIRefPreferred(): Record<string, ResponseObject | ReferenceObject>;
    toOpenAPIRefPreferred(ctxt: IOpenAPIResponseContext): Record<string, ResponseObject | ReferenceObject>;
    toOpenAPIRefPreferred(ctxt: IOpenAPIResponseContext = {}): Record<string, ResponseObject | ReferenceObject> {
        let name = this.name;
        if (this.code) {
            name = `${this.code}`;
        }
        if (ctxt.code) {
            name = `${ctxt.code}`;
        }
        if (ctxt.default) {
            name = 'default';
        }
        if (this.default) {
            name = 'default';
        }
        if (ctxt.ref) {
            return {
                [name]: {
                    $ref: ctxt.ref
                }
            };
        }
        if (this.ref) {
            return {
                [name]: {
                    $ref: this.ref
                }
            };
        }
        if (this.name) {
            return {
                [name]: {
                    $ref: `#/components/responses/${this.name}`
                }
            }
        }
        return super.toOpenAPI(ctxt)
    }
}
