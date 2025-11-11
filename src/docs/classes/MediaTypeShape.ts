import { MediaTypeUtil } from '@novice1/api-doc-generator';
import { ExampleObject, MediaTypeObject, ReferenceObject, SchemaObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import { ExampleShape } from './ExampleShape';
import { SchemaShape } from './SchemaShape';

export interface MediaTypeShapeConfig extends Omit<Omit<MediaTypeObject, 'examples'>, 'schema'> {
    examples?: Record<string, ExampleObject | ReferenceObject | ExampleShape>
    schema?: SchemaObject | ReferenceObject | SchemaShape;
}

export class MediaTypeShape extends MediaTypeUtil {
    constructor(mediaType?: MediaTypeShapeConfig) {
        if (mediaType) {
            const { examples, schema, ...rest } = mediaType
            super(rest)
            if (examples) {
                this.setExamples(examples)
            }
            if (schema) {
                this.setSchema(schema)
            }
        } else {
            super()
        }
    }

    setExamples(examples: Record<string, ExampleObject | ReferenceObject | ExampleShape>, noRef?: boolean): this {
        const value: Record<string, ExampleObject | ReferenceObject> = {}
        for (const key in examples) {
            const example = examples[key]
            if (example instanceof ExampleShape) {
                if (noRef) {
                    value[key] = example.toObject()
                } else {
                    value[key] = example.ref()
                }
            } else {
                value[key] = example
            }
        }
        super.setExamples(value)
        return this
    }

    setSchema(schema: ReferenceObject | SchemaObject | SchemaShape, noRef?: boolean): this {
        const value: ReferenceObject | SchemaObject = schema instanceof SchemaShape ?
            noRef ? schema.toObject() : schema.ref() : schema;
        super.setSchema(value)
        return this
    }
}