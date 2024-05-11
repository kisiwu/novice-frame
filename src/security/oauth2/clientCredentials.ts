import { GrantType, OAuth2Util } from '@novice1/api-doc-generator'
import { OAuth2Error, OAuth2ErrorResponse, OAuth2InvalidRequestResponse, OAuth2UnauthorizedClientResponse } from './responses'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import routing, {IRouter} from '@novice1/routing'
import { IOAuth2Route, OAuth2Handler, OAuth2RefreshTokenParams, OAuth2RefreshTokenRoute } from './route'
import { OAuth2Builder } from '../builder'
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils'

export interface OAuth2ClientCredsTokenParams {
    grantType: string
    clientId: string
    clientSecret: string
    scope?: string
}

export interface OAuth2ClientCredsTokenHandler<
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
> extends OAuth2Handler<OAuth2ClientCredsTokenParams> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2ClientCredsTokenParams,
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}


export class OAuth2ClientCredsTokenRoute<
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
    protected handler?: OAuth2ClientCredsTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>

    constructor(url: string, handler?: OAuth2ClientCredsTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {
        this.url = url
        this.handler = handler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2ClientCredsTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): OAuth2ClientCredsTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
        this.handler = handler
        return this
    }

    getHandler(): OAuth2ClientCredsTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }
}

export class OAuth2ClientCredsBuilder extends OAuth2Builder {
    protected tokenRoute: IOAuth2Route
    protected refreshTokenRoute?: IOAuth2Route

    constructor(
        securitySchemeName: string,
        tokenRoute: OAuth2ClientCredsTokenRoute,
        refreshTokenRoute?: OAuth2RefreshTokenRoute
    ) {
        super(securitySchemeName)
        this.tokenRoute = tokenRoute
        this.refreshTokenRoute = refreshTokenRoute
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRefreshTokenRoute<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, Locals extends Record<string, any> = Record<string, any>, MetaResType = any>
    (refreshTokenRoute: OAuth2RefreshTokenRoute<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): this {
        this.refreshTokenRoute = refreshTokenRoute;
        return this;
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
                req.body.grant_type === 'client_credentials'
            ) {
                let clientId: string,
                    clientSecret: string,
                    tmpClientId: string | undefined,
                    tmpClientSecret: string | undefined;

                const authHeaderValue = req.header('authorization')
                if (authHeaderValue) {
                    // remove 'Basic ' and convert the base64 to string
                    const value = Buffer.from(authHeaderValue.substring(5), 'base64').toString();
                    // split client_id and client_secret from string
                    [tmpClientId, tmpClientSecret] = value.split(':')
                }

                if (tmpClientId) {
                    clientId = tmpClientId
                } else {
                    return res.status(400).json(new OAuth2InvalidRequestResponse('Request was missing the \'client_id\' parameter.'))
                }
                if (tmpClientSecret) {
                    clientSecret = tmpClientSecret
                } else {
                    return res.status(400).json(new OAuth2InvalidRequestResponse('Request was missing the \'client_secret\' parameter.'))
                }
                const params: OAuth2ClientCredsTokenParams = {
                    clientId: clientId,
                    clientSecret: clientSecret,
                    grantType: req.body.grant_type
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
                if (req.body.grant_type != 'client_credentials' || (refreshTokenUrl == tokenUrl &&
                    req.body.grant_type != 'refresh_token')) {
                    error = 'unsupported_grant_type'
                    errorDescription = `Request does not support the 'grant_type' '${req.body.grant_type}'.`
                }
                req.body.grant_type === 'client_credentials'
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

    buildDoc(): BaseAuthUtil {
        const docs = new OAuth2Util(this.securitySchemeName)
            .setGrantType(GrantType.clientCredentials)
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