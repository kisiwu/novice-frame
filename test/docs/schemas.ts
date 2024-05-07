import { ReferenceObject, SchemaObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';

export const schemas: Record<string, ReferenceObject | SchemaObject> = {
    SuccessMessage: {
        description: 'Confirmation that the operation went well.',
        type: 'string',
        example: 'Everything is fine.'
    },
    UsernamePathResponse: {
        description: 'The greeting.',
        type: 'object',
        properties: {
            message: {
                $ref: '#/components/schemas/SuccessMessage'
            }
        },
        required: [
            'message'
        ]
    }
}