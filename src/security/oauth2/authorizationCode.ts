import routing from '@novice1/routing'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import { OAuth2Error, OAuth2ErrorResponse, OAuth2UnauthorizedClientResponse } from './responses'
import { GrantType, OAuth2Util } from '@novice1/api-doc-generator'
import { IOAuth2Route, OAuth2Handler, OAuth2RefreshTokenParams, OAuth2RefreshTokenRoute } from './route'

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

export interface OAuth2ACAuthorizationHandler<
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
> extends OAuth2Handler<OAuth2ACAuthorizationParams> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2ACAuthorizationParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2ACTokenHandler<
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
> extends OAuth2Handler<OAuth2ACTokenParams> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2ACTokenParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export class OAuth2ACAuthorizationRoute<
    P = core.ParamsDictionary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ResBody = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReqBody = any,
    ReqQuery = ParsedQs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Locals extends Record<string, any> = Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MetaResType = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PostResBody = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PostReqBody = any,
    PostReqQuery = ParsedQs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PostLocals extends Record<string, any> = Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PostMetaResType = any
> implements IOAuth2Route {
    protected url: string
    protected handler?: OAuth2ACAuthorizationHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>
    protected postHandler?: OAuth2ACAuthorizationHandler<P, PostResBody, PostReqBody, PostReqQuery, PostLocals, PostMetaResType>

    constructor(
        url: string, 
        handler?: OAuth2ACAuthorizationHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        postHandler?: OAuth2ACAuthorizationHandler<P, PostResBody, PostReqBody, PostReqQuery, PostLocals, PostMetaResType>
    ) {
        this.url = url
        this.handler = handler
        this.postHandler = postHandler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2ACAuthorizationHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>):
        OAuth2ACAuthorizationRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType, PostResBody, PostReqBody, PostReqQuery, PostLocals, PostMetaResType> {
        this.handler = handler
        return this
    }

    setPostHandler(postHandler?: OAuth2ACAuthorizationHandler<P, PostResBody, PostReqBody, PostReqQuery, PostLocals, PostMetaResType>):
        OAuth2ACAuthorizationRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType, PostResBody, PostReqBody, PostReqQuery, PostLocals, PostMetaResType> {
        this.postHandler = postHandler
        return this
    }

    getHandler(): OAuth2ACAuthorizationHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }

    getPostHandler(): OAuth2ACAuthorizationHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }
}

export class OAuth2ACTokenRoute<
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
> implements IOAuth2Route {
    protected url: string
    protected handler?: OAuth2ACTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>

    constructor(url: string, handler?: OAuth2ACTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {
        this.url = url
        this.handler = handler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2ACTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): OAuth2ACTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
        this.handler = handler
        return this
    }

    getHandler(): OAuth2ACTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }
}

export class OAuth2ACRouterBuilder {
    protected securitySchemeName: string
    protected authorizationRoute: OAuth2ACAuthorizationRoute
    protected tokenRoute: IOAuth2Route
    protected refreshTokenRoute?: IOAuth2Route
    protected description?: string
    protected scopes?: Record<string, string>

    constructor(
        securitySchemeName: string,
        authorizationRoute: OAuth2ACAuthorizationRoute,
        tokenRoute: OAuth2ACTokenRoute,
        refreshTokenRoute?: OAuth2RefreshTokenRoute
    ) {
        this.securitySchemeName = securitySchemeName
        this.authorizationRoute = authorizationRoute
        this.tokenRoute = tokenRoute
        this.refreshTokenRoute = refreshTokenRoute
    }

    setDescription(description: string): OAuth2ACRouterBuilder {
        this.description = description;
        return this;
    }

    /**
     * 
     * @param scopes The scopes of the access request.
     * A map between the scope name and a short description for it. The map MAY be empty.
     * @returns 
     */
    setScopes(scopes: Record<string, string>): OAuth2ACRouterBuilder {
        this.scopes = scopes;
        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRefreshTokenRoute<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, Locals extends Record<string, any> = Record<string, any>, MetaResType = any>
    (refreshTokenRoute: OAuth2RefreshTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): OAuth2ACRouterBuilder {
        this.refreshTokenRoute = refreshTokenRoute;
        return this;
    }

    getScopes(): Record<string, string> | undefined {
        return this.scopes
    }

    getSecuritySchemeName(): string {
        return this.securitySchemeName;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    getAuthorizationUrl(): string {
        return this.authorizationRoute.getUrl()
    }

    getRefreshTokenUrl(): string | undefined {
        return this.refreshTokenRoute?.getUrl()
    }

    getTokenUrl(): string {
        return this.tokenRoute.getUrl()
    }

    build(): routing.IRouter {

        const authorizationUrl = this.getAuthorizationUrl();
        const tokenUrl = this.getTokenUrl();
        const refreshTokenUrl = this.getRefreshTokenUrl();


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
                    //if (this.methods.authorizationGet) {
                    //    return this.methods.authorizationGet(params, req, res, next)
                    //} else {
                    //    return res.status(401).send('<h1>OAuth Error</h1><p>Authorization unavailable</p>')
                    //}
                    const handler = this.authorizationRoute.getHandler()
                    if (handler) {
                        return handler(params, req, res, next)
                    } else {
                        return res.status(401).send('<h1>OAuth Error</h1><p>Authorization unavailable</p>')
                    }
                } else {
                    const handler = this.authorizationRoute.getPostHandler()
                    if (handler) {
                        return handler(params, req, res, next)
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
                path: authorizationUrl,
                parameters: {
                    undoc: true
                }
            }, authorizationController)
            .post({
                path: authorizationUrl,
                parameters: {
                    undoc: true
                }
            }, authorizationController);

        // tokenUrl
        router.post({
            path: tokenUrl,
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

                const handler = this.tokenRoute.getHandler()
                if (handler) {
                    return handler(params, req, res, next)
                } else {
                    return res.status(400).json(new OAuth2UnauthorizedClientResponse())
                }
            } else if (
                refreshTokenUrl == tokenUrl &&
                req.body.grant_type === 'refresh_token'
            ) {
                if (
                    req.body.client_id && typeof req.body.client_id === 'string' &&
                    req.body.client_secret && typeof req.body.client_secret === 'string' &&
                    req.body.refresh_token && typeof req.body.refresh_token === 'string'
                ) {
                    const params: OAuth2RefreshTokenParams = {
                        clientId: req.body.client_id,
                        clientSecret: req.body.client_secret,
                        grantType: req.body.grant_type,
                        refreshToken: req.body.refresh_token
                    }

                    const handler = this.refreshTokenRoute?.getHandler()
                    if (handler) {
                        return handler(params, req, res, next)
                    } else {
                        return res.status(400).json(new OAuth2UnauthorizedClientResponse())
                    }
                } else {
                    let error: OAuth2Error = 'unauthorized_client';
                    let errorDescription = ''
                    if (!(req.body.client_id && typeof req.body.client_id === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_id\' parameter.'
                    } else if (!(req.body.client_secret && typeof req.body.client_secret === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_secret\' parameter.'
                    } else if (!(req.body.refresh_token && typeof req.body.refresh_token === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'refresh_token\' parameter.'
                    }
                    return res.status(400).json(new OAuth2ErrorResponse(error, errorDescription))
                }
            } else {
                let error: OAuth2Error = 'unauthorized_client';
                let errorDescription = ''
                if (req.body.grant_type != 'authorization_code' || (refreshTokenUrl == tokenUrl &&
                    req.body.grant_type != 'refresh_token')) {
                    error = 'unsupported_grant_type'
                    errorDescription = `Request does not support the 'grant_type' '${req.body.grant_type}'.`
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

        // refreshToken
        if (refreshTokenUrl && refreshTokenUrl != tokenUrl) {
            router.post({
                path: refreshTokenUrl,
                parameters: {
                    undoc: true
                }
            }, (req, res, next) => {
                // validating body
                if (
                    req.body.client_id && typeof req.body.client_id === 'string' &&
                    req.body.client_secret && typeof req.body.client_secret === 'string' &&
                    req.body.refresh_token && typeof req.body.refresh_token === 'string' &&
                    req.body.grant_type === 'refresh_token'
                ) {
                    const params: OAuth2RefreshTokenParams = {
                        clientId: req.body.client_id,
                        clientSecret: req.body.client_secret,
                        grantType: req.body.grant_type,
                        refreshToken: req.body.refresh_token
                    }

                    const handler = this.refreshTokenRoute?.getHandler()
                    if (handler) {
                        return handler(params, req, res, next)
                    } else {
                        return res.status(400).json(new OAuth2UnauthorizedClientResponse())
                    }
                } else {
                    let error: OAuth2Error = 'unauthorized_client';
                    let errorDescription = ''
                    if (req.body.grant_type != 'refresh_token') {
                        error = 'unsupported_grant_type'
                        errorDescription = `Request does not support the 'grant_type' '${req.body.grant_type}'.`
                    } else if (!(req.body.client_id && typeof req.body.client_id === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_id\' parameter.'
                    } else if (!(req.body.client_secret && typeof req.body.client_secret === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_secret\' parameter.'
                    } else if (!(req.body.refresh_token && typeof req.body.refresh_token === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'refresh_token\' parameter.'
                    }
                    return res.status(400).json(new OAuth2ErrorResponse(error, errorDescription))
                }
            });
        }

        return router
    }

    buildDoc() {
        const docs = new OAuth2Util(this.securitySchemeName)
            .setGrantType(GrantType.authorizationCode)
            .setAuthUrl(this.authorizationRoute.getUrl())
            .setScopes(this.getScopes() || {})
            .setAccessTokenUrl(this.tokenRoute.getUrl());

        if (this.description) {
            docs.setDescription(this.description)
        }
        if (this.refreshTokenRoute) {
            docs.setRefreshUrl(this.refreshTokenRoute.getUrl())
        }

        return docs
    }

}