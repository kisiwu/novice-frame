import routing from '@novice1/routing';
// import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as core from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import Stream, { Readable } from 'stream';

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
  MetaResType = unknown,
> {
  (
    req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>,
    res: core.Response<ResBody, Locals>,
    next: core.NextFunction
  ):
    | ResBody
    | void
    | core.Response<ResBody, Locals>
    | Promise<ResBody>
    | Promise<void>
    | Promise<core.Response<ResBody, Locals>>;
}

/**
 * Wrap a controller function into an express request handler
 * @param handler
 * @returns
 */
export function controller<
  P = core.ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(
  handler: Controller<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>
): routing.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> {
  return async function (req, res, next) {
    const value = await handler(req, res, next);
    if (typeof value != 'undefined' && !res.headersSent) {
      // if stream
      if (value instanceof Stream) {
        // the stream must be readable
        if (value instanceof ReadableStream || value instanceof Readable) {
          return value.pipe(res);
        }
        // do nothing
        return;
      }

      // if buffer
      if (value instanceof Buffer) {
        // simply send the content
        return res.send(value);
      }

      // if no 'Content-Type' header
      if (!res.hasHeader('Content-Type')) {
        // there is no 'Content-Type' header, we have to guess how to return the content
        if (typeof value === 'object') {
          return res.json(value);
        } else if (typeof value === 'string') {
          return res.setHeader('Content-Type', 'text/plain').send(value);
        }
      }

      // simply send the content
      return res.send(value);
    }
    // do nothing
    return;
  };
}

//#endregion controller

//#region controllerV2

export type ReqRefDefaults = {
  body: unknown;
  params: core.ParamsDictionary;
  query: ParsedQs;
  resBody: unknown;
};

export type ReqRef = Partial<Record<keyof ReqRefDefaults, unknown>>;

/**
 * Wrap a controller function into an express request handler
 * @param handler
 * @returns
 */
export function controllerV2<
  Refs extends ReqRef = ReqRefDefaults,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(
  handler: Controller<Refs['params'], Refs['resBody'], Refs['body'], Refs['query'], Locals, MetaResType>
): routing.RequestHandler<Refs['params'], Refs['resBody'], Refs['body'], Refs['query'], Locals, MetaResType> {
  return controller(handler);
}

//#endregion controllerV2

//#region controllerV3

/*
export type ReqSchema<
  B extends StandardSchemaV1 | undefined,
  P extends StandardSchemaV1 | undefined,
  Q extends StandardSchemaV1 | undefined,
> = {
  body?: B;
  params?: P;
  query?: Q;
};

async function validateSchema<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
  options?: StandardSchemaV1.Options | undefined
): Promise<StandardSchemaV1.Result<unknown>> {
  return await schema['~standard'].validate(value, options);
}

// StandardSchemaV1.InferOutput<TSchema>

export function controllerV3<
  BodySchema extends StandardSchemaV1 | undefined = undefined,
  ParamsSchema extends StandardSchemaV1 | undefined = undefined,
  QuerySchema extends StandardSchemaV1 | undefined = undefined,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(
  schema: ReqSchema<BodySchema, ParamsSchema, QuerySchema>,
  handler: Controller<
    ParamsSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<ParamsSchema> : core.ParamsDictionary,
    MetaResType,
    BodySchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<BodySchema> : unknown,
    QuerySchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<QuerySchema> : ParsedQs,
    Locals,
    MetaResType
  >
): routing.RequestHandler<
  ParamsSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<ParamsSchema> : core.ParamsDictionary,
  MetaResType,
  BodySchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<BodySchema> : unknown,
  QuerySchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<QuerySchema> : ParsedQs,
  Locals,
  MetaResType
> {
  return controller(handler);
}
*/
//#endregion controllerV3
