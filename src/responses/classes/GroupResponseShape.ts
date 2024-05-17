import { GroupResponseUtil } from '@novice1/api-doc-generator';
import { ResponseObject, ReferenceObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import { BaseResponseUtil } from '@novice1/api-doc-generator/lib/utils/responses/all';
import extend from 'extend';
import { ResponseShape } from './ResponseShape';

export class GroupResponseShape extends GroupResponseUtil {
    constructor(responseUtils: BaseResponseUtil[]) {
        super(responseUtils);
        this.responseUtils = responseUtils;
    }
    toOpenAPIRefPreferred(): Record<string, ResponseObject | ReferenceObject> {
        let r: Record<string, ResponseObject | ReferenceObject> = {};
        this.responseUtils.forEach(builder => {
            if (builder instanceof ResponseShape) {
                r = extend(r, builder.toOpenAPIRefPreferred());
            } else {
                r = extend(r, builder.toOpenAPI());
            }
        });
        return r;
    }
}
