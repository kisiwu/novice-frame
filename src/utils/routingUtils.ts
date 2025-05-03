import routing from '@novice1/routing'
import * as core from 'express-serve-static-core';
import { ParsedQs } from 'qs'

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
    ): ResBody | void | Promise<ResBody> | Promise<void>;
}

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
            if (!res.hasHeader('Content-Type')) {
                // there is no 'Content-Type' header, we have to guess how to return the content
                if (typeof value === 'object') {
                    return res.json(value)
                } else if (typeof value === 'string') {
                    return res.setHeader('Content-Type', 'text/plain').send(value)
                }
            }
            return res.send(value)
        }
        return
    }
}