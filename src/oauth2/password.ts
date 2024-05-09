import { GrantType, OAuth2Util } from '@novice1/api-doc-generator'
import { OAuth2Error, OAuth2ErrorResponse, OAuth2UnauthorizedClientResponse } from './responses'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import routing, {IRouter} from '@novice1/routing'
import { IOAuth2Route, OAuth2Handler, OAuth2RefreshTokenParams, OAuth2RefreshTokenRoute } from './route'

export interface OAuth2PasswordTokenParams {
    grantType: string
    clientId: string
    clientSecret: string
    username: string
    password: string
    scope?: string
}

export interface OAuth2PasswordTokenHandler<
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
> extends OAuth2Handler<OAuth2PasswordTokenParams> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2PasswordTokenParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}


export class OAuth2PasswordTokenRoute<
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
    protected handler?: OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>

    constructor(url: string, handler?: OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {
        this.url = url
        this.handler = handler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): OAuth2PasswordTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
        this.handler = handler
        return this
    }

    getHandler(): OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }
}

export class OAuth2PasswordRouterBuilder {
    protected securitySchemeName: string
    protected tokenRoute: IOAuth2Route
    protected refreshTokenRoute?: IOAuth2Route
    protected description?: string
    protected scopes?: Record<string, string>

    constructor(
        securitySchemeName: string,
        tokenRoute: OAuth2PasswordTokenRoute,
        refreshTokenRoute?: OAuth2RefreshTokenRoute
    ) {
        this.securitySchemeName = securitySchemeName
        this.tokenRoute = tokenRoute
        this.refreshTokenRoute = refreshTokenRoute
    }

    setDescription(description: string): OAuth2PasswordRouterBuilder {
        this.description = description;
        return this;
    }

    /**
     * 
     * @param scopes The scopes of the access request.
     * A map between the scope name and a short description for it. The map MAY be empty.
     * @returns 
     */
    setScopes(scopes: Record<string, string>): OAuth2PasswordRouterBuilder {
        this.scopes = scopes;
        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRefreshTokenRoute<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, Locals extends Record<string, any> = Record<string, any>, MetaResType = any>
    (refreshTokenRoute: OAuth2RefreshTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): OAuth2PasswordRouterBuilder {
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

    getRefreshTokenUrl(): string | undefined {
        return this.refreshTokenRoute?.getUrl()
    }

    getTokenUrl(): string {
        return this.tokenRoute.getUrl()
    }

    build(): IRouter {
        
        const tokenUrl = this.getTokenUrl();
        const refreshTokenUrl = this.getRefreshTokenUrl();


        const router = routing()

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
                req.body.client_secret && typeof req.body.client_secret === 'string' &&
                req.body.username && typeof req.body.username === 'string' &&
                req.body.password && typeof req.body.password === 'string' &&
                req.body.grant_type === 'password'
            ) {
                const params: OAuth2PasswordTokenParams = {
                    clientId: req.body.client_id,
                    clientSecret: req.body.client_secret,
                    grantType: req.body.grant_type,
                    username: req.body.username,
                    password: req.body.password,
                }
                if (req.body.scope && typeof req.body.scope === 'string') {
                    params.scope = req.body.scope
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
                if (req.body.grant_type != 'password' || (refreshTokenUrl == tokenUrl &&
                    req.body.grant_type != 'refresh_token')) {
                    error = 'unsupported_grant_type'
                    errorDescription = `Request does not support the 'grant_type' '${req.body.grant_type}'.`
                } else if (!(req.body.client_id && typeof req.body.client_id === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'client_id\' parameter.'
                } else if (!(req.body.client_secret && typeof req.body.client_secret === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'client_secret\' parameter.'
                } else if (!(req.body.username && typeof req.body.username === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'username\' parameter.'
                } else if (!(req.body.password && typeof req.body.password === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'client_secret\' parameter.'
                }
                req.body.grant_type === 'password'
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
            .setGrantType(GrantType.passwordCredentials)
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