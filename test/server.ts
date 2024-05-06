import { Frame } from '../src/index'
import Joi from 'joi';

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
        }
    },
    framework: {
        cors: true
    },
});

/**
 * To keep registering routes
 * event after launching (listen(...)) the server
 */
const dynamicRouter = app.lazyrouter()

app.openapi.addServer({
    url: 'http://localhost:3000'
})


app.get({
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
        path: '/user/:name',
        name: 'Username path',
        description: 'Serve username path api',
        parameters: {
            params: {
                name: Joi.string().valid('novice').required()
            }
        }
    }, (req, res) => {
        res.json({ message: `Hello ${req.params.name}!` })
    })
    .use((_, res) => {
        res.status(404).json({message: 'Not found'});
    })
    .listen(3000)

dynamicRouter.get('/end', (_, res) => {
    res.json({message: 'Bye bye!'});
})

// because we added a route after
// launching (listen(...)) the server
app.refreshDocs()
