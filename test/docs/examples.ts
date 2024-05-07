import { ExampleObject, ReferenceObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';

export const examples: Record<string, ReferenceObject | ExampleObject> = {
    UsernamePathResponseExampleA: {
        value: { message: 'Hello novice!' },
        description: 'The response'
    },
    UsernamePathResponseExampleB: {
        value: { message: 'Hello novice1!' },
        description: 'The response'
    }
}