import { ClientAuthentication, GrantType, OAuth2Util } from '@novice1/api-doc-generator'
import { OAuth2Error, OAuth2ErrorResponse, OAuth2InvalidRequestResponse, OAuth2UnauthorizedClientResponse } from './responses'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import routing, {IRouter} from '@novice1/routing'
import { IOAuth2Route, OAuth2BadRequestHandler, OAuth2Handler, OAuth2RefreshTokenParams, OAuth2RefreshTokenRoute } from './route'
import { OAuth2Shape } from '../shapes'
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils'

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
    protected badRequestHandler?: OAuth2BadRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>

    constructor(url: string, handler?: OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {
        this.url = url
        this.handler = handler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): this {
        this.handler = handler
        return this
    }

    getHandler(): OAuth2PasswordTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.handler
    }

    setBadRequestHandler(handler?: OAuth2BadRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): this {
        this.badRequestHandler = handler
        return this
    }

    resetBadRequestHandler(): this {
        this.badRequestHandler = undefined
        return this
    }

    getBadRequestHandler(): OAuth2BadRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
        return this.badRequestHandler
    }
}

export class OAuth2PasswordShape extends OAuth2Shape {
    protected tokenRoute: IOAuth2Route
    protected refreshTokenRoute?: IOAuth2Route

    protected clientAuthentication: ClientAuthentication = ClientAuthentication.body

    constructor(
        securitySchemeName: string,
        tokenRoute: OAuth2PasswordTokenRoute,
        refreshTokenRoute?: OAuth2RefreshTokenRoute
    ) {
        super(securitySchemeName)
        this.tokenRoute = tokenRoute
        this.refreshTokenRoute = refreshTokenRoute
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _retrieveClientAuthentication(req: routing.Request<core.ParamsDictionary, any, any, ParsedQs, Record<string, any>, any>): {clientId?: string, clientSecret?: string} {
        const result: { clientId?: string, clientSecret?: string } = {}
        let tmpClientId: string | undefined,
            tmpClientSecret: string | undefined;

        if (this.isClientAuthenticationToBody()) {
            if (typeof req.body.client_id === 'string') {
                tmpClientId = req.body.client_id
            }
            if (typeof req.body.client_secret === 'string') {
                tmpClientSecret = req.body.client_secret
            }
        } else if (this.isClientAuthenticationToHeader()) {
            const authHeaderValue = req.header('authorization')
            if (authHeaderValue) {
                // remove 'Basic ' and convert the base64 to string
                const value = Buffer.from(authHeaderValue.substring(5), 'base64').toString();
                // split client_id and client_secret from string
                [tmpClientId, tmpClientSecret] = value.split(':')
            }
        }

        if (tmpClientId) {
            result.clientId = tmpClientId
        }
        if (tmpClientSecret) {
            result.clientSecret = tmpClientSecret
        }

        return result
    }

    clientAuthenticationToBody(): this {
        this.clientAuthentication = ClientAuthentication.body
        return this
    }
    isClientAuthenticationToBody(): boolean {
        return this.clientAuthentication == ClientAuthentication.body
    }

    clientAuthenticationToHeader(): this {
        this.clientAuthentication = ClientAuthentication.header
        return this
    }
    isClientAuthenticationToHeader(): boolean {
        return this.clientAuthentication == ClientAuthentication.header
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

    router(): IRouter {
        
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
                req.body.username && typeof req.body.username === 'string' &&
                req.body.password && typeof req.body.password === 'string' &&
                req.body.grant_type === 'password'
            ) {
                const clientAuthentication = this._retrieveClientAuthentication(req)

                if (!clientAuthentication.clientId) {
                    return res.status(400).json(new OAuth2InvalidRequestResponse('Request was missing the \'client_id\' parameter.'))
                }
                if (!clientAuthentication.clientSecret) {
                    return res.status(400).json(new OAuth2InvalidRequestResponse('Request was missing the \'client_secret\' parameter.'))
                }
                const params: OAuth2PasswordTokenParams = {
                    clientId: clientAuthentication.clientId,
                    clientSecret: clientAuthentication.clientSecret,
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
                const clientAuthentication = this._retrieveClientAuthentication(req)
                if (
                    clientAuthentication.clientId && clientAuthentication.clientSecret &&
                    req.body.refresh_token && typeof req.body.refresh_token === 'string'
                ) {
                    const params: OAuth2RefreshTokenParams = {
                        clientId: clientAuthentication.clientId,
                        clientSecret: clientAuthentication.clientSecret,
                        grantType: req.body.grant_type,
                        refreshToken: req.body.refresh_token
                    }

                    if (req.body.scope && typeof req.body.scope === 'string') {
                        params.scope = req.body.scope
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
                    if (!clientAuthentication.clientId) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_id\' parameter.'
                    } else if (!clientAuthentication.clientSecret) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_secret\' parameter.'
                    } else if (!(req.body.refresh_token && typeof req.body.refresh_token === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'refresh_token\' parameter.'
                    }
                    const err = new OAuth2ErrorResponse(error, errorDescription)
                    const handler = this.refreshTokenRoute?.getBadRequestHandler()
                    if (handler) {
                        return handler(err, req, res, next)
                    } else {
                        return res.status(400).json(err)
                    }
                }
            } else {
                let error: OAuth2Error = 'unauthorized_client';
                let errorDescription = ''
                if (req.body.grant_type != 'password' || (refreshTokenUrl == tokenUrl &&
                    req.body.grant_type != 'refresh_token')) {
                    error = 'unsupported_grant_type'
                    errorDescription = `Request does not support the 'grant_type' '${req.body.grant_type}'.`
                } else if (!(req.body.username && typeof req.body.username === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'username\' parameter.'
                } else if (!(req.body.password && typeof req.body.password === 'string')) {
                    error = 'invalid_request'
                    errorDescription = 'Request was missing the \'password\' parameter.'
                }
                const err = new OAuth2ErrorResponse(error, errorDescription)
                const handler = this.tokenRoute.getBadRequestHandler()
                if (handler) {
                    return handler(err, req, res, next)
                } else {
                    return res.status(400).json(err)
                }
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
                const clientAuthentication = this._retrieveClientAuthentication(req)
                // validating body
                if (
                    clientAuthentication.clientId && clientAuthentication.clientSecret &&
                    req.body.refresh_token && typeof req.body.refresh_token === 'string' &&
                    req.body.grant_type === 'refresh_token'
                ) {
                    const params: OAuth2RefreshTokenParams = {
                        clientId: clientAuthentication.clientId,
                        clientSecret: clientAuthentication.clientSecret,
                        grantType: req.body.grant_type,
                        refreshToken: req.body.refresh_token
                    }

                    if (req.body.scope && typeof req.body.scope === 'string') {
                        params.scope = req.body.scope
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
                    } else if (!clientAuthentication.clientId) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_id\' parameter.'
                    } else if (!clientAuthentication.clientSecret) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'client_secret\' parameter.'
                    } else if (!(req.body.refresh_token && typeof req.body.refresh_token === 'string')) {
                        error = 'invalid_request'
                        errorDescription = 'Request was missing the \'refresh_token\' parameter.'
                    }
                    const err = new OAuth2ErrorResponse(error, errorDescription)
                    const handler = this.refreshTokenRoute?.getBadRequestHandler()
                    if (handler) {
                        return handler(err, req, res, next)
                    } else {
                        return res.status(400).json(err)
                    }
                }
            });
        }

        return router
    }

    scheme(): BaseAuthUtil {
        const docs = new OAuth2Util(this.securitySchemeName)
            .setGrantType(GrantType.passwordCredentials)
            .setScopes(this.getScopes() || {})
            .setAccessTokenUrl(this.tokenRoute.getUrl())
            .setClientAuthentication(this.clientAuthentication);

        if (this.description) {
            docs.setDescription(this.description)
        }
        if (this.refreshTokenRoute) {
            docs.setRefreshUrl(this.refreshTokenRoute.getUrl())
        }

        return docs
    }

}