import http from 'http';
import { FrameworkApp, Options } from '@novice1/app';
import { GroupAuthUtil, OpenAPI, Postman } from '@novice1/api-doc-generator';
import { LicenseObject, ServerObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import validatorJoi from '@novice1/validator-joi';
import Joi from 'joi';

import { createDocsRouter } from './routers/docs';



export interface StarterOptions extends Options {
    docs?: {
        path?: string,
        title?: string,
        consumes?: string[],
        security?: GroupAuthUtil,
        license?: LicenseObject | string,
        hosts?: ServerObject[]
    }
}

export class FrameworkStarter extends FrameworkApp {

    #docsPath: string = '/docs'

    protected docs: {openapi: OpenAPI, postman: Postman}

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
                validatorJoi({ stripUnknown: true }, (err, _req, res, _next) => {
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

        if (config?.docs?.hosts) {
            this.docs.openapi.setServers(config?.docs?.hosts);
            this.docs.postman.setHost(config?.docs?.hosts.map(h => h.url));

            //this.docs.postman.addVariable({})
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
}

/**** TESTS ****/

const app = new FrameworkStarter({
    docs: {
        hosts: [
            {
                url: 'http://localhost:3000'
            },
            {
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
            }
        ],
        title: '@novice1 API',
        license: {
            name: 'ISC',
            url: 'https://opensource.org/license/isc-license-txt'
        }
    }
});

app.get({
    path: '/',
    description: 'Homepage',
}, (_, res) => {
    res.json({message: 'hello world'})
})
.get({
    path: '/username',
    description: 'Username',
    parameters: {
        query: {
            name: Joi.string().valid('novice')
        }
    }
}, (req, res) => {
    res.json({message: `Hello ${req.query.name || 'world'}!`})
})
.get({
    path: '/user/:name',
    description: 'Username',
    parameters: {
        params: {
            name: Joi.string().valid('novice').required()
        }
    }
}, (req, res) => {
    res.json({message: `Hello ${req.params.name}!`})
})
.listen(3000)

/**** /TESTS ****/