
import { ErrorRequestHandler } from 'express';
import { Frame } from '../src/index'
import Joi from 'joi';
import { examples } from './docs/examples';
import { schemas } from './docs/schemas';
import { UsernamePathResponse } from './docs/responses';
import { security } from './docs/security';
import securityRouter from './routers/security';

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
        security: security,
        options: {
            logo: {
                url: 'https://cdn-icons-png.flaticon.com/512/10169/10169724.png',
                alt: 'API logo'
            },
            tagGroups: {
                'Test operations': ['Users', 'Test']
            }
        }
    },
    framework: {
        cors: true
    },
    routers: [
        securityRouter
    ]
});

app.openapi
    .addServer({
        url: 'http://localhost:3000'
    })
    .setExamples(examples)
    .setSchemas(schemas)

/**
 * To keep registering routes
 * even after launching (listen(...)) the server
 */
const dynamicRouter = app.lazyrouter()

dynamicRouter.get({
    path: '/',
    tags: 'Test',
    name: 'Homepage',
    description: 'Serve homepage api',
}, (_, res) => {
    res.json({ message: 'hello world' })
})
    .post({
        auth: true,
        tags: ['Users'],
        path: '/user',
        name: 'Add a user',
        description: 'Serve username path api',
        parameters: {
            onerror: ((): ErrorRequestHandler => {
                return (err, _req, res) => {
                    // avoid sending sensitive data (e.g: '_original' from joi validator)
                    const { _original, ...response } = err
                    res.status(400).json(response)
                }
            })(),
            body: {
                username: Joi.string().min(5).max(30).required().example('MySuperUserName'),
                email: Joi.string().email().required(),
                password: Joi.string().meta({ format: 'password' }).required(),
                birth: Joi.date().meta({ format: 'datetime' }).min(new Date(0)),
                notes: Joi.string().max(5120)
            },
            consumes: ['application/json', 'multipart/form-data'],
        },
    }, (req, res) => {
        res.json({ message: 'user added', entity: req.body })
    })
    .get({
        tags: ['Users'],
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
        tags: ['Users'],
        path: '/user/:name',
        name: 'Username path',
        description: 'Serve username path api',
        parameters: {
            //security: bearer, // uncomment if we only want bearer auth for this route
            params: {
                name: Joi.string().valid('novice', 'novice1').required()
            },
        },
        responses: UsernamePathResponse
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
}, 2000)

