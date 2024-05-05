import http from 'http';
import { FrameworkApp, Options } from '@novice1/app';
import { GroupAuthUtil, OpenAPI, Postman } from '@novice1/api-doc-generator';
import { LicenseObject, ServerObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import validatorJoi from '@novice1/validator-joi';
import Joi from 'joi';

import routing, { RequestHandler, RouteSettings } from '@novice1/routing';
import * as core from 'express-serve-static-core';

import { ParsedQs } from 'qs';

import { createDocsRouter } from './routers/docs';



export interface StarterOptions extends Options {
    docs?: {
        path?: string,
        title?: string,
        consumes?: string[],
        security?: GroupAuthUtil,
        license?: LicenseObject | string,
        host?: ServerObject
    }
}

export class FrameworkStarter extends FrameworkApp {

    #docsPath: string = '/docs'

    protected docs: { openapi: OpenAPI, postman: Postman }

    get openapi() {
        return this.docs.openapi
    }

    get postman() {
        return this.docs.postman
    }

    constructor(config?: StarterOptions) {

        // add default validator if none was specified
        if (!config?.framework?.validators?.length) {
            config = { ...config }
            config.framework = config.framework || {}
            config.framework.validators = config.framework.validators || []
            config.framework.validators.push(
                validatorJoi({ stripUnknown: true }, (err, _req, res) => {
                    return res.status(400).json(err);
                })
            )
        }

        super(config)

        this.docs = {
            openapi: new OpenAPI(),
            postman: new Postman()
        }

        if (config?.docs?.path) {
            this.#docsPath = config.docs.path
        }

        if (config?.docs?.title) {
            this.docs.openapi.setTitle(config?.docs?.title);
            this.docs.postman.setName(config?.docs?.title);
        } else {
            this.docs.openapi.setTitle('API documentation');
            this.docs.postman.setName('API documentation');
        }

        if (config?.docs?.consumes) {
            this.docs.openapi.setConsumes(config?.docs?.consumes);
            this.docs.postman.setConsumes(config?.docs?.consumes);
        } else {
            this.docs.openapi.setConsumes(['application/json']);
            this.docs.postman.setConsumes(['application/json']);
        }

        if (config?.docs?.security) {
            this.docs.openapi.addSecurityScheme(config?.docs?.security)
                .setDefaultSecurity(config?.docs?.security);
            this.docs.postman.setDefaultSecurity(config?.docs?.security);
        }

        if (config?.docs?.license) {
            if (typeof config?.docs?.license === 'string')
                this.docs.openapi.setLicense(config?.docs?.license);
            else
                this.docs.openapi.setLicense(config?.docs?.license);
        }

        if (config?.docs?.host?.url) {
            const hostUrl = config.docs.host.url;
            const regex = /(?<=(?<!\{)\{)[^{}]*(?=\}(?!\}))/g;
            const variables = config.docs.host.variables;

            this.docs.openapi.setServers(config.docs.host);

            this.docs.postman.setHost(hostUrl.replace(regex, match => {
                return `{${match}}`
            }));

            if (variables && Object.keys(variables).length) {
                Object.keys(variables).forEach(
                    varName => {
                        this.docs.postman.addVariable({
                            description: variables[varName].description,
                            key: varName,
                            name: varName,
                            value: variables[varName].default
                        })
                    }
                )
            }
        }
    }

    protected addDocsRoute() {
        this.addRouters(createDocsRouter(this.#docsPath, this.docs))
    }

    refreshDocs() {
        this.docs.openapi.add(this.meta);
        this.docs.postman.add(this.meta);
    }

    build<T extends http.ServerOptions = http.ServerOptions>(options?: T | null, mod?: {
        createServer(requestListener?: http.RequestListener): http.Server;
        createServer(options: T, requestListener?: http.RequestListener | undefined): http.Server;
    }): http.Server {
        this.addDocsRoute();
        const result = super.build(options, mod);
        this.refreshDocs();
        return result;
    }

    get deco() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const app = this;
        return {
            get<P = core.ParamsDictionary, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ResBody = any, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ReqBody = any, 
                ReqQuery = ParsedQs, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Locals extends Record<string, any> = Record<string, any>, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                MetaResType = any>(settings: RouteSettings<core.PathParams, P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {

                return (controller: RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>, context: ClassMethodDecoratorContext) => {
                    const methodName = String(context.name);

                    const copy = {...settings}

                    if (typeof copy.name == 'undefined') {
                        copy.name = methodName
                    }
                    if (typeof copy.description == 'undefined') {
                        copy.description = methodName
                    }

                    app.get(copy, controller)
                }
            },

        }
    }
}

/**** TESTS ****/

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
    }
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

/**** /TESTS ****/

/*** TEST DECORATOR ***/
class SimpleController {

    @app.deco.get({path: '/decoratorclass', description: 'Serve decorator controller', parameters: {
        query: {
            name: Joi.string()
        }
    }})
    static async serveDecorator(req: routing.Request, res: core.Response) {
        // Downside: cannot use 'this', even in instance method
        return res.json({message: `Decorator controller: ${req.query.name || ''}`})
    }
}

new SimpleController();


// needed to refresh docs if routes are registered after build/listen of app
app.refreshDocs();


/*** /TEST DECORATOR ***/
