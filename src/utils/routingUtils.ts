import routing from '@novice1/routing'
import * as core from 'express-serve-static-core';
import Stream, { Readable } from 'stream';
import { ParsedQs } from 'qs'

//#region controller

/**
 * Controller function type
 */
export interface Controller<
    P = core.ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
    Locals extends Record<string, unknown> = Record<string, unknown>,
    MetaResType = unknown
> {
    (
        req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
        res: core.Response<ResBody, Locals>,
        next: core.NextFunction,
    ): ResBody | void | core.Response<ResBody, Locals> | Promise<ResBody> | Promise<void> | Promise<core.Response<ResBody, Locals>>;
}

/**
 * Wrap a controller function into an express request handler
 * @param handler 
 * @returns 
 */
export function controller<P = core.ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
    Locals extends Record<string, unknown> = Record<string, unknown>,
    MetaResType = unknown
>(handler: Controller<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): routing.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
    return async function (req, res, next) {
        const value = await handler(req, res, next)
        if (typeof value != 'undefined' && !res.headersSent) {

            // if stream
            if (value instanceof Stream) {
                // the stream must be readable
                if (value instanceof ReadableStream || value instanceof Readable) {
                    return value.pipe(res)
                }
                // do nothing
                return
            }

            // if buffer
            if (value instanceof Buffer) {
                // simply send the content
                return res.send(value)
            }

            // if no 'Content-Type' header
            if (!res.hasHeader('Content-Type')) {
                // there is no 'Content-Type' header, we have to guess how to return the content
                if (typeof value === 'object') {
                    return res.json(value)
                } else if (typeof value === 'string') {
                    return res.setHeader('Content-Type', 'text/plain').send(value)
                }
            }

            // simply send the content
            return res.send(value)
        }
        // do nothing
        return
    }
}

//#endregion controller

//#region controllerV2

export type ReqRefDefaults = {
    body: unknown
    params: core.ParamsDictionary
    query: ParsedQs
    resBody: unknown
}

export type ReqRef = Partial<Record<keyof ReqRefDefaults, unknown>>;

/**
 * Wrap a controller function into an express request handler
 * @param handler 
 * @returns 
 */
export function controllerV2<
    Refs extends ReqRef = ReqRefDefaults, Locals extends Record<string, unknown> = Record<string, unknown>, MetaResType = unknown>(handler: Controller<
        Refs['params'],
        Refs['resBody'],
        Refs['body'],
        Refs['query'],
        Locals,
        MetaResType
    >): routing.RequestHandler<Refs['params'], Refs['resBody'], Refs['body'], Refs['query'], Locals, MetaResType> {
    return controller(handler)
}

//#endregion controllerV2
