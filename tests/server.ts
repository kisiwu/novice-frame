import {FrameworkStarter} from '../src/index'
import Joi from 'joi';

// TODO: 
//- cors

const app = new FrameworkStarter({
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

    },
});

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
    .listen(3000)