import routing from '@novice1/routing'
import * as core from 'express-serve-static-core';
import { ParsedQs } from 'qs'

export function controller<P = core.ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = ParsedQs,
    Locals extends Record<string, unknown> = Record<string, unknown>,
    MetaResType = unknown
>(handler: routing.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>): routing.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
    return handler
}