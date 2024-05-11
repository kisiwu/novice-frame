import http from 'http';
import cookieParser from 'cookie-parser';
import express, {} from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { FrameworkApp, FrameworkOptions as BaseFrameworkOptions, Options } from '@novice1/app';
import { OpenAPI, Postman } from '@novice1/api-doc-generator';
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/all';
import { LicenseObject, ServerObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions';
import validatorJoi from '@novice1/validator-joi';

import { DocsOptions, createDocsRouter } from './routers/docs';
import routing from '@novice1/routing';
import { ISecurityPad } from './security';

export * from '@novice1/app'
export * from '@novice1/api-doc-generator'
export * from './security'

export interface FrameworkOptions extends BaseFrameworkOptions {
    bodyParser?: {
        json?: bodyParser.OptionsJson
        urlencoded?: bodyParser.OptionsUrlencoded
    }
    cookieParser?: {
        secret?: string | string[]
        options?: cookieParser.CookieParseOptions
    }
    cors?: cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | boolean
}

export interface DocsLogo {
    url: string
    alt?: string
}

export interface FrameOptions extends Options {
    docs?: {
        path?: string
        title?: string
        consumes?: string[]
        security?: BaseAuthUtil
        license?: LicenseObject | string
        host?: ServerObject
        options?: DocsOptions
    }
    framework?: FrameworkOptions,
    security?: ISecurityPad
}

export class Frame extends FrameworkApp {

    #docsPath: string = '/docs'

    #docsOptions: DocsOptions = {}

    protected docs: { openapi: OpenAPI, postman: Postman }

    get openapi() {
        return this.docs.openapi
    }

    get postman() {
        return this.docs.postman
    }

    constructor(config?: FrameOptions) {

        // make sure there is a framework config
        config = { ...config }
        config.framework = config.framework || {}

        // add default middlewares
        config.framework.middlewares = config.framework.middlewares || []
        if (config.framework.cors) {
            config.framework.middlewares.unshift(
                typeof config.framework.cors == 'boolean' ? cors() : cors(config.framework.cors)
            );
        }
        config.framework.middlewares.unshift(
            cookieParser(config.framework.cookieParser?.secret, config.framework.cookieParser?.options),
            express.json(config.framework.bodyParser?.json),
            express.urlencoded(config.framework.bodyParser?.urlencoded || { extended: true }),
        )

        // add default auth
        config.framework.auth = config.framework.auth || []
        if (config.security) {
            const authHandlers = config.security.getAuthHandlers();
            config.framework.auth.push(
                ...authHandlers
            )
        }

        // add default validator if none was specified
        if (!config.framework.validators?.length) {
            config.framework.validators = config.framework.validators || []
            config.framework.validators.push(
                validatorJoi({ stripUnknown: true }, (err, _req, res) => {
                    return res.status(400).json(err);
                })
            )
        }

        // add default routers
        config.routers = config.routers || []
        if (config.framework.cors) {
            config.routers.unshift(
                routing().options({
                    path: '*',
                    parameters: {
                        undoc: true
                    }
                }, typeof config.framework.cors == 'boolean' ? cors() : cors(config.framework.cors))
            )
        }
        if (config.security?.getRouter) {
            config.routers.push(
                config.security.getRouter()
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
        } else if (config.security) {
            const securityScheme = config.security.getScheme()
            this.docs.openapi.addSecurityScheme(securityScheme)
                .setDefaultSecurity(securityScheme);
            this.docs.postman.setDefaultSecurity(securityScheme);
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

        if(config.docs?.options) {
            this.#docsOptions = config.docs.options
        }

        this._addDocsRoute();
    }

    private _addDocsRoute() {
        this.addRouters(createDocsRouter(this.#docsPath, this.docs, this.#docsOptions))
    }

    /**
     * @TODO fix refresh for postman
     * (problem: it adds the same routes multiple time)
     */
    refreshDocs() {
        this.docs.openapi.removeAll();
        this.docs.postman.removeAll();
        this.docs.openapi.add(this.meta);
        this.docs.postman.add(this.meta);
    }

    build<T extends http.ServerOptions = http.ServerOptions>(options?: T | null, mod?: {
        createServer(requestListener?: http.RequestListener): http.Server;
        createServer(options: T, requestListener?: http.RequestListener | undefined): http.Server;
    }): http.Server {
        const result = super.build(options, mod);
        this.refreshDocs();
        return result;
    }
}
