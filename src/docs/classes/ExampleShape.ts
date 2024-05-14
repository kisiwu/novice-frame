import { ExampleObject, ReferenceObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';

export class ExampleShape {

    protected name: string
    protected value: unknown
    protected externalValue?: string
    protected summary?: string;
    protected description?: string;

    constructor(name: string, example?: ExampleObject) {
        this.name = name
        if (example) {
            this.value = example.value
            this.externalValue = example.externalValue
            this.summary = example.summary
            this.description = example.description
        }
    }

    getName(): string {
        return this.name
    }

    setValue(value: unknown): this {
        this.value = value
        return this
    }

    setExternalValue(externalValue: string): this {
        this.externalValue = externalValue
        return this
    }

    setSummary(summary: string): this {
        this.summary = summary
        return this
    }

    setDescription(description: string): this {
        this.description = description
        return this
    }

    ref(): ReferenceObject {
        return { $ref: `#/components/examples/${this.name}` }
    }

    toObject(): ExampleObject {
        return {
            description: this.description,
            externalValue: this.externalValue,
            summary: this.summary,
            value: this.value
        }
    }

    toJSON(): ExampleObject {
        return this.toObject()
    }
}