import routing from '@novice1/routing'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import { OAuth2Error, OAuth2ErrorResponse } from './responses'

export interface OAuth2ACAuthorizationParams {
    clientId: string
    responseType: string
    redirectUri: string
    scope: string
    state?: string
    codeChallenge?: string
}

export interface OAuth2ACTokenParams {
    grantType: string
    code: string
    clientId: string
    clientSecret?: string
    codeVerifier?: string
    redirectUri?: string
}

export interface OAuth2ACAuthorizationMethod<
    P = core.ParamsDictionary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResBody = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReqBody = any,
    ReqQuery = ParsedQs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Locals extends Record<string, any> = Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MetaResType = any
> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2ACAuthorizationParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2ACTokenMethod<
    P = core.ParamsDictionary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResBody = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReqBody = any,
    ReqQuery = ParsedQs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Locals extends Record<string, any> = Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MetaResType = any
> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2ACTokenParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2ACUrls {
    authorizationUrl?: string
    refreshTokenUrl?: string
    tokenUrl?: string
}

export interface OAuth2ACMethods {
    authorizationGet?: OAuth2ACAuthorizationMethod
    authorizationPost?: OAuth2ACAuthorizationMethod
    refreshTokenPost?: OAuth2ACAuthorizationMethod
    tokenPost?: OAuth2ACTokenMethod
}

export class OAuth2ACRouterBuilder {

    static readonly authorizationUrl = '/oauth2/authorization'
    static readonly refreshTokenUrl = '/oauth2/refresh_token'
    static readonly tokenUrl = '/oauth2/token'

    protected urls: Required<OAuth2ACUrls>

    protected methods: OAuth2ACMethods

    constructor() {
        this.methods = {}
        this.urls = {
            authorizationUrl: OAuth2ACRouterBuilder.authorizationUrl,
            refreshTokenUrl: OAuth2ACRouterBuilder.refreshTokenUrl,
            tokenUrl: OAuth2ACRouterBuilder.tokenUrl
        }
    }

    setAuthorizationUrl(authorizationUrl: string): OAuth2ACRouterBuilder {
        this.urls.authorizationUrl = authorizationUrl
        return this
    }

    setRefreshTokenUrl(refreshTokenUrl: string): OAuth2ACRouterBuilder {
        this.urls.refreshTokenUrl = refreshTokenUrl
        return this
    }

    setTokenUrl(tokenUrl: string): OAuth2ACRouterBuilder {
        this.urls.tokenUrl = tokenUrl
        return this
    }

    getAuthorizationUrl(): string {
        return this.urls.authorizationUrl
    }

    getRefreshTokenUrl(): string {
        return this.urls.refreshTokenUrl
    }

    getTokenUrl(): string {
        return this.urls.tokenUrl
    }

    build(): routing.IRouter {
        const router = routing()

        // authorizationUrl
        const authorizationController: routing.RequestHandler = (req, res, next) => {
            // validating query
            if (
                req.query.client_id && typeof req.query.client_id === 'string' &&
                req.query.response_type === 'code' &&
                req.query.redirect_uri && typeof req.query.redirect_uri === 'string' &&
                req.query.scope && typeof req.query.scope === 'string'
            ) {
                const params: OAuth2ACAuthorizationParams = {
                    clientId: req.query.client_id,
                    redirectUri: req.query.response_type,
                    responseType: req.query.redirect_uri,
                    scope: req.query.scope
                }
                if (req.query.state && typeof req.query.state === 'string') {
                    params.state = req.query.state
                }
                if (req.query.code_challenge && typeof req.query.code_challenge === 'string') {
                    params.codeChallenge = req.query.code_challenge
                }

                if (req.method.toLowerCase() === 'get') {
                    if (this.methods.authorizationGet) {
                        return this.methods.authorizationGet(params, req, res, next)
                    } else {
                        return res.status(401).send('<h1>OAuth Error</h1><p>Authorization unavailable</p>')
                    }
                } else {
                    if (this.methods.authorizationPost) {
                        return this.methods.authorizationPost(params, req, res, next)
                    } else {
                        return res.status(401).send('<h1>OAuth Error</h1><p>Authorization post unavailable</p>')
                    }
                }
            } else {
                return res.status(401).send('<h1>OAuth Error</h1>')
            }
        };
        router
            .get({
                path: this.urls.authorizationUrl,
                parameters: {
                    undoc: true
                }
            }, authorizationController)
            .post({
                path: this.urls.authorizationUrl,
                parameters: {
                    undoc: true
                }
            }, authorizationController);

        // tokenUrl
        router.post({
            path: this.urls.tokenUrl,
            parameters: {
                undoc: true
            }
        }, (req, res, next) => {
            // validating body
            if (
                req.body.client_id && typeof req.body.client_id === 'string' &&
                req.body.code && typeof req.body.code === 'string' &&
                req.body.grant_type === 'authorization_code'
            ) {
                const params: OAuth2ACTokenParams = {
                    clientId: req.body.client_id,
                    grantType: req.body.grant_type,
                    code: req.body.code
                }
                if (req.body.client_secret && typeof req.body.client_secret === 'string') {
                    params.clientSecret = req.body.client_secret
                }
                if (req.body.code_verifier && typeof req.body.code_verifier === 'string') {
                    params.codeVerifier = req.body.code_verifier
                }
                if (req.body.redirect_uri && typeof req.body.redirect_uri === 'string') {
                    params.redirectUri = req.body.redirect_uri
                }

                if (this.methods.tokenPost) {
                    return this.methods.tokenPost(params, req, res, next)
                } else {
                    return res.status(400).json(new OAuth2ErrorResponse('unauthorized_client'))
                }
            } else {
                let error: OAuth2Error = 'unauthorized_client';
                let errorDescription = ''
                if (req.body.grant_type != 'authorization_code') {
                    error = 'unsupported_grant_type'
                    errorDescription = 'Request expected the \'grant_type\' parameter to equal \'authorization_code\'.'
                } else if (!(req.body.client_id && typeof req.body.client_id === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'client_id\' parameter.'
                } else if (!(req.body.code && typeof req.body.code === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'code\' parameter.'
                }
                return res.status(400).json(new OAuth2ErrorResponse(error, errorDescription))
            }
        });

        return router
    }

}