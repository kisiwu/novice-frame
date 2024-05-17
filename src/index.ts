import http from 'http';
import cookieParser from 'cookie-parser';
import express, {} from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { FrameworkApp, FrameworkOptions as BaseFrameworkOptions, Options } from '@novice1/app';
import { OpenAPI, Postman } from '@novice1/api-doc-generator';
import validatorJoi from '@novice1/validator-joi';

import routing from '@novice1/routing';
import { createDocsRouter } from './routers/docs';
import { ISecurityShape } from './security';
import { DocsConfig, DocsOptions, IDocsShape } from './docs';

export * from '@novice1/app'
export * from '@novice1/api-doc-generator'
export * from './docs';
export * from './security'
export * from './services/responseService'
export * from './services/securityService'

export interface FrameworkOptions extends BaseFrameworkOptions {
    bodyParser?: {
        json?: bodyParser.OptionsJson
        urlencoded?: bodyParser.OptionsUrlencoded
    }
    cookieParser?: {
        secret?: string | string[]
        options?: cookieParser.CookieParseOptions
    }
    cors?: cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | boolean,
    /**
     * Error request handler for the default validator
     * if no validitor was set in constructor
     */
    validatorOnError?: routing.ErrorRequestHandler
}

export interface FrameOptions extends Options {
    docs?: DocsConfig | IDocsShape
    framework?: FrameworkOptions
    security?: ISecurityShape
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
        // make sure there is a config
        config = { ...config }

        // make sure there is a framework config
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
            const authHandlers = config.security.authHandlers();
            config.framework.auth.push(
                ...authHandlers
            )
        }

        // add default validator if none was specified
        if (!config.framework.validators?.length) {
            config.framework.validators = config.framework.validators || []
            const onerror: routing.ErrorRequestHandler = typeof config.framework.validatorOnError == 'function' ? 
                config.framework.validatorOnError : 
                (err, _req, res) => {
                    return res.status(400).json(err);
                };
            config.framework.validators.push(
                validatorJoi({ stripUnknown: true }, onerror)
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
        if (config.security?.router) {
            config.routers.push(
                config.security.router()
            )
        }

        super(config)

        this.docs = {
            openapi: new OpenAPI(),
            postman: new Postman()
        }

        let docsConfig: DocsConfig | undefined
        if (config?.docs) {
            if ('docs' in config.docs) {
                docsConfig = config.docs.docs()
            } else {
                docsConfig = config?.docs
            }
        }  

        if (docsConfig?.path) {
            this.#docsPath = docsConfig.path
        }

        if (docsConfig?.title) {
            this.docs.openapi.setTitle(docsConfig?.title);
            this.docs.postman.setName(docsConfig?.title);
        } else {
            this.docs.openapi.setTitle('API documentation');
            this.docs.postman.setName('API documentation');
        }

        if (docsConfig?.consumes) {
            this.docs.openapi.setConsumes(docsConfig?.consumes);
            this.docs.postman.setConsumes(docsConfig?.consumes);
        } else {
            this.docs.openapi.setConsumes(['application/json']);
            this.docs.postman.setConsumes(['application/json']);
        }

        if (docsConfig?.security) {
            this.docs.openapi.addSecurityScheme(docsConfig?.security)
                .setDefaultSecurity(docsConfig?.security);
            this.docs.postman.setDefaultSecurity(docsConfig?.security);
        } else if (config.security) {
            const securityScheme = config.security.scheme()
            this.docs.openapi.addSecurityScheme(securityScheme)
                .setDefaultSecurity(securityScheme);
            this.docs.postman.setDefaultSecurity(securityScheme);
        }

        if (docsConfig?.license) {
            if (typeof docsConfig?.license === 'string')
                this.docs.openapi.setLicense(docsConfig?.license);
            else
                this.docs.openapi.setLicense(docsConfig?.license);
        }

        if (docsConfig?.host?.url) {
            const hostUrl = docsConfig.host.url;
            const regex = /(?<=(?<!\{)\{)[^{}]*(?=\}(?!\}))/g;
            const variables = docsConfig.host.variables;

            this.docs.openapi.setServers(docsConfig.host);

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

        if(docsConfig?.examples) {
            this.docs.openapi.setExamples(docsConfig.examples);
        }

        if(docsConfig?.schemas) {
            this.docs.openapi.setSchemas(docsConfig.schemas);
        }

        if(docsConfig?.responses) {
            this.docs.openapi.setResponses(docsConfig?.responses);
        }

        if(docsConfig?.options) {
            this.#docsOptions = docsConfig.options
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
