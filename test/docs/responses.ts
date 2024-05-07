import { MediaTypeUtil, ResponseUtil } from '../../src';


export const UsernamePathResponse = new ResponseUtil('UsernamePathResponse')
    .setDescription('Success')
    .setCode(200)
    .addMediaType('application/json', new MediaTypeUtil({
        examples: {
            output_a: { $ref: '#/components/examples/UsernamePathResponseExampleA' },
            output_b: { $ref: '#/components/examples/UsernamePathResponseExampleB' }
        },
        schema: {
            $ref: '#/components/schemas/UsernamePathResponse'
        }
    }))