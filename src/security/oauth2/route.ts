import { Request } from '@novice1/routing'
import * as core from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import { OAuth2ErrorResponse } from './responses'

export interface OAuth2RefreshTokenParams {
    grantType: string
    refreshToken: string
    clientId: string
    clientSecret: string
    scope?: string
}

export interface OAuth2Handler<P> {
    (
        params: P,
        req: Request,
        res: core.Response,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2AnyBadRequestHandler {
    (
        error: OAuth2ErrorResponse,
        req: Request,
        res: core.Response,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2BadRequestHandler<
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
> extends OAuth2AnyBadRequestHandler {
    (
        error: OAuth2ErrorResponse,
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export interface OAuth2RefreshTokenHandler<
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
> extends OAuth2Handler<OAuth2RefreshTokenParams> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
        params: OAuth2RefreshTokenParams,
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): void;
}

export class OAuth2RefreshTokenRoute<
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
    protected url: string
    protected handler?: OAuth2RefreshTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>
    protected badRequestHandler?: OAuth2BadRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>

    constructor(url: string, handler?: OAuth2RefreshTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>) {
        this.url = url
        this.handler = handler
    }

    getUrl(): string {
        return this.url
    }

    setHandler(handler?: OAuth2RefreshTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): this {
        this.handler = handler
        return this
    }

    getHandler(): OAuth2RefreshTokenHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> | undefined {
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


export interface IOAuth2Route {
    getUrl(): string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getHandler(): OAuth2Handler<any> | undefined

    getBadRequestHandler(): OAuth2AnyBadRequestHandler | undefined
}