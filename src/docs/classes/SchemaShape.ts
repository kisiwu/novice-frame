import { ReferenceObject, SchemaObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import extend from 'extend';

export interface ISchemaShape {
    ref(): ReferenceObject
    toObject(): SchemaObject
    toJSON(): SchemaObject
}

export class SchemaShape implements ISchemaShape {
    protected name: string
    protected schema: SchemaObject = {}

    constructor(name: string, schema?: SchemaObject) {
        this.name = name
        if (schema) {
            this.schema = extend(true, {}, schema);
        }
    }

    ref(): ReferenceObject {
        return { $ref: `#/components/schemas/${this.name}` }
    }

    toObject(): SchemaObject {
        return extend(true, {}, this.schema);
    }

    toJSON(): SchemaObject {
        return this.toObject()
    }
}