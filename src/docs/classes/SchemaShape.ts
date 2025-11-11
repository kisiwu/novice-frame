import { ReferenceObject, SchemaObject, SchemaObject3_0, SchemaObject3_1 } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import extend from 'extend';

type SchemaProp<T extends keyof SchemaObject> = Pick<SchemaObject, T>

type Schema3_0Prop<T extends keyof SchemaObject3_0> = Pick<SchemaObject3_0, T>
type Schema3_1Prop<T extends keyof SchemaObject3_1> = Pick<SchemaObject3_1, T>

export interface ISchemaShape {
    ref(): ReferenceObject
    toObject(): SchemaObject
    toJSON(): SchemaObject
}

export interface SchemaShapeObject extends
    SchemaProp<'title'>,
    SchemaProp<'description'>,
    SchemaProp<'type'>,
    SchemaProp<'format'>,
    SchemaProp<'pattern'>,
    SchemaProp<'default'>,
    SchemaProp<'enum'>,
    SchemaProp<'multipleOf'>,
    SchemaProp<'uniqueItems'>,
    SchemaProp<'additionalProperties'>,
    SchemaProp<'required'>,
    SchemaProp<'maxLength'>,
    SchemaProp<'minLength'>,
    SchemaProp<'maxItems'>,
    SchemaProp<'minItems'>,
    SchemaProp<'maxProperties'>,
    SchemaProp<'minProperties'>,
    SchemaProp<'maximum'>,
    SchemaProp<'minimum'>,
    SchemaProp<'exclusiveMaximum'>,
    SchemaProp<'exclusiveMinimum'>,
    Schema3_0Prop<'nullable'>,
    SchemaProp<'discriminator'>,
    SchemaProp<'readOnly'>,
    SchemaProp<'writeOnly'>,
    SchemaProp<'xml'>,
    SchemaProp<'externalDocs'>,
    Schema3_0Prop<'example'>,
    Schema3_1Prop<'examples'>,
    SchemaProp<'deprecated'> {
    allOf?: Array<SchemaObject | ReferenceObject | ISchemaShape>;
    anyOf?: Array<SchemaObject | ReferenceObject | ISchemaShape>;
    oneOf?: Array<SchemaObject | ReferenceObject | ISchemaShape>;
    not?: SchemaObject | ReferenceObject | ISchemaShape;
    items?: SchemaObject | ReferenceObject | ISchemaShape;
    properties?: Record<string, SchemaObject | ReferenceObject | ISchemaShape>;
}

export class SchemaShape implements ISchemaShape {
    protected name: string
    protected schema: SchemaObject = {}

    constructor(name: string, schema?: SchemaShapeObject) {
        this.name = name
        if (schema) {
            this.setSchema(schema);
        }
    }

    private _convertOneShape(v: SchemaObject | ReferenceObject | ISchemaShape): SchemaObject | ReferenceObject {
        return 'ref' in v && typeof v.ref == 'function' ? v.ref() : {...(v as SchemaObject | ReferenceObject)}
    }

    private _convertManyShapes(v: Array<SchemaObject | ReferenceObject | ISchemaShape>): Array<SchemaObject | ReferenceObject> {
        const r: Array<SchemaObject | ReferenceObject> = []
        for (const element of v) {
            r.push(this._convertOneShape(element))
        }
        return r
    }

    private _convertObjectOfShapes(v: Record<string, SchemaObject | ReferenceObject | ISchemaShape>): Record<string, SchemaObject | ReferenceObject> {
        const r: Record<string, SchemaObject | ReferenceObject> = {}
        for (const k in v) {
            r[k] = (this._convertOneShape(v[k]))
        }
        return r
    }

    getName(): string {
        return this.name
    }

    setSchema(schema: SchemaShapeObject): this {
        const { allOf, anyOf, oneOf, not, items, properties, ...value } = schema
        const valueToKeep: SchemaObject = value
        if (allOf) {
            valueToKeep.allOf = this._convertManyShapes(allOf)
        }
        if (anyOf) {
            valueToKeep.anyOf = this._convertManyShapes(anyOf)
        }
        if (oneOf) {
            valueToKeep.oneOf = this._convertManyShapes(oneOf)
        }
        if (not) {
            valueToKeep.not = this._convertOneShape(not)
        }
        if (items) {
            valueToKeep.items = this._convertOneShape(items)
        }
        if (properties) {
            valueToKeep.properties = this._convertObjectOfShapes(properties)
        }
        this.schema = extend(true, {}, value);
        return this
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