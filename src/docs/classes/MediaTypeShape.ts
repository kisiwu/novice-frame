import { MediaTypeUtil } from '@novice1/api-doc-generator';
import { ExampleObject, MediaTypeObject, ReferenceObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import { ExampleShape } from './ExampleShape';

export interface MediaTypeShapeConfig extends Omit<MediaTypeObject, 'examples'> {
    examples?: Record<string, ExampleObject | ReferenceObject | ExampleShape>
}

export class MediaTypeShape extends MediaTypeUtil {
    constructor(mediaType?: MediaTypeShapeConfig) {
        if (mediaType) {
            const {examples, ...rest} = mediaType
            super(rest)
            if (examples) {
                this.setExamples(examples)
            }
        } else {
            super()
        }
    }

    setExamples(examples: Record<string, ExampleObject | ReferenceObject | ExampleShape>, noRef?: boolean): this {
        const value: Record<string, ExampleObject | ReferenceObject> = {}
        for(const key in examples) {
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
}