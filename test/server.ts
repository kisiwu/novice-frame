import { BearerUtil, Frame, GrantType, GroupAuthUtil, MediaTypeUtil, OAuth2Util, ResponseUtil } from '../src/index'
import Joi from 'joi';

const oauth2 = new OAuth2Util('oauth2')
    .setGrantType(GrantType.passwordCredentials)
    .setDescription('This API uses OAuth 2 with the implicit grant flow. [More info](/docs/redoc)')
    .setAuthUrl('/oauth2/authorize')
    .setScopes({
        read_pets: 'read your pets',
        write_pets: 'modify pets in your account'
    });
const bearer = new BearerUtil('bearer')

const security = new GroupAuthUtil([
    bearer,
    oauth2
]);

const app = new Frame({
    docs: {
        host: {
            url: 'http://{domain}:{port}',
            description: 'API url for development',
            variables: {
                domain: {
                    default: 'localhost',
                    description: 'Dev domain'
                },
                port: {
                    enum: [
                        '3000',
                        '8000',
                        '80'
                    ],
                    default: '3000'
                }
            }
        },
        title: '@novice1 API',
        license: {
            name: 'ISC',
            url: 'https://opensource.org/license/isc-license-txt'
        },
        security: security
    },
    framework: {
        cors: true
    },
});

/**
 * To keep registering routes
 * even after launching (listen(...)) the server
 */
const dynamicRouter = app.lazyrouter()

app.openapi.addServer({
    url: 'http://localhost:3000'
})

app.openapi
    .addExample('UsernamePathResponseExample', {
        value: { message: 'Hello novice!' },
        description: 'The response'
    })
    .addSchema('SuccessMessage', {
        description: 'Confirmation that the operation went well.',
        type: 'string',
        example: 'Everything is fine.'
    })
    .addSchema('UsernamePathResponse', {
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
    })


dynamicRouter.get({
    path: '/',
    name: 'Homepage',
    description: 'Serve homepage api',
}, (_, res) => {
    res.json({ message: 'hello world' })
})
    .get({
        path: '/username',
        name: 'Username',
        description: 'Serve username api',
        parameters: {
            query: {
                name: Joi.string().valid('novice')
            }
        }
    }, (req, res) => {
        res.json({ message: `Hello ${req.query.name || 'world'}!` })
    })
    .get({
        auth: true,
        path: '/user/:name',
        name: 'Username path',
        description: 'Serve username path api',
        parameters: {
            //security: bearer, // uncomment if we only want bearer auth for this route
            params: {
                name: Joi.string().valid('novice').required().meta({ ref: '#/components/examples/NameParams' })
            },
        },
        /*
        responses: new GroupResponseUtil([
            new ResponseUtil('UsernamePathResponse')
                .setDescription('Success')
                .setCode(200)
                .addMediaType('application/json', new MediaTypeUtil({
                    examples: {
                        general_output: { $ref: '#/components/examples/UsernamePathResponseExample' }
                    },
                    schema: {
                        $ref: '#/components/schemas/UsernamePathResponse'
                    }
                }))
        ]),
        */
        responses: new ResponseUtil('UsernamePathResponse')
        .setDescription('Success')
        .setCode(200)
        .addMediaType('application/json', new MediaTypeUtil({
            examples: {
                general_output: { $ref: '#/components/examples/UsernamePathResponseExample' }
            },
            schema: {
                $ref: '#/components/schemas/UsernamePathResponse'
            }
        }))
    }, (req, res) => {
        res.json({ message: `Hello ${req.params.name}!` })
    });

app.use((_, res) => {
    res.status(404).json({ message: 'Not found' });
})
    .listen(3000)

// register a route after "app.listen(...)"
setTimeout(() => {
    dynamicRouter.get('/end', (_, res) => {
        res.json({ message: 'Bye bye!' });
    })

    // because we added a route after
    // launching (listen(...)) the server
    app.refreshDocs()
}, 10000)

