import type { Controller } from '../routingUtils';
import type { ErrorRequestHandler, RouteSettings, MetaParameters } from '@novice1/routing';
import type routing from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type * as core from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

export type StandardValidatorSchema = {
  body?: StandardSchemaV1 | undefined;
  headers?: StandardSchemaV1 | undefined;
  cookies?: StandardSchemaV1 | undefined;
  params?: StandardSchemaV1 | undefined;
  query?: StandardSchemaV1 | undefined;
  files?: StandardSchemaV1 | undefined;
};

export type ValidatedData<S extends StandardValidatorSchema> = {
  [
    K in keyof S & keyof StandardValidatorSchema as NonNullable<S[K]> extends StandardSchemaV1 ? K : never
  ]: StandardSchemaV1.InferOutput<NonNullable<S[K]>>;
};

export interface SchemaController<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, unknown>,
  MetaResType,
  V,
> {
  (
    req: routing.Request<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType> & { validated(): V },
    res: core.Response<ResBody, Locals>,
    next: core.NextFunction
  ): ReturnType<Controller<P, ResBody, ReqBody, ReqQuery, Locals, MetaResType>>;
}

export type SchemaHandlers<
  Settings extends WithStandardSchema & { path: unknown },
  ResBody,
  Locals extends Record<string, unknown>,
  MetaResType,
> = SchemaController<
  Settings['parameters']['standardSchema']['params'] extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['params']>
    : Settings['path'] extends string
      ? core.RouteParameters<Settings['path']>
      : core.ParamsDictionary,
  ResBody,
  Settings['parameters']['standardSchema']['body'] extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['body']>
    : unknown,
  ParsedQs,
  Locals,
  MetaResType,
  ValidatedData<Settings['parameters']['standardSchema']>
>[];

export interface ValidatorConfig {
  options?: StandardSchemaV1.Options | undefined;
  onerror?: ErrorRequestHandler | undefined;
}

export interface WithStandardSchema {
  parameters: MetaParameters & {
    standardSchema: StandardValidatorSchema;
    options?: StandardSchemaV1.Options | undefined;
    onerror?: ErrorRequestHandler | undefined;
  };
}

export type SchemaRouteSettings<
  Path extends string,
  P = core.RouteParameters<Path>,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = WithStandardSchema & RouteSettings<Path, P, ResBody, unknown, ParsedQs, Locals, MetaResType>;

export type SchemaRouteSettingsAnyPath<
  P = core.ParamsDictionary,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = WithStandardSchema & RouteSettings<core.PathParams, P, ResBody, unknown, ParsedQs, Locals, MetaResType>;

//#region Factory

type OutputOf<S, K extends string, Fallback> = S extends { [P in K]: infer T }
  ? T extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<T>
    : Fallback
  : Fallback;

export type SchemaSettings<
  Path,
  S extends StandardValidatorSchema,
  ResBody,
  Locals extends Record<string, unknown>,
  MetaResType,
> = RouteSettings<Path, unknown, ResBody, unknown, ParsedQs, Locals, MetaResType> & {
  schema: S;
  options?: StandardSchemaV1.Options | undefined;
  onerror?: ErrorRequestHandler | undefined;
};

export type SchemaHandlersFor<
  Path,
  S extends StandardValidatorSchema,
  ResBody,
  Locals extends Record<string, unknown>,
  MetaResType,
> = SchemaController<
  OutputOf<S, 'params', Path extends string ? core.RouteParameters<Path> : core.ParamsDictionary>,
  ResBody,
  OutputOf<S, 'body', unknown>,
  OutputOf<S, 'query', ParsedQs>,
  Locals,
  MetaResType,
  ValidatedData<S>
>[];

export type HttpMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

/**
 * Represents an object that can add schema-based routes to a router.
 * Provides the `route` method to define routes with request validation and type-safe handlers.
 */
export interface SchemaRouteAdder<ResBody, Locals extends Record<string, unknown>, MetaResType, Next> {
  route<Path extends string, S extends StandardValidatorSchema>(
    method: HttpMethod,
    settings: SchemaSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  route<S extends StandardValidatorSchema>(
    method: HttpMethod,
    settings: SchemaSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
}

/**
 * Represents a router that supports schema-based route definitions.
 * Provides methods to define routes with request validation and type-safe handlers.
 */
export interface RouterWithSchema extends SchemaRouteAdder<
  unknown,
  Record<string, unknown>,
  unknown,
  RouterWithSchema
> {
  /**
   * Returns an object that allows chaining route definitions with schema validation.
   * Use `.with<ResBody, Locals, MetaResType>()` to specify the types for the route handlers.
   *
   * - `ResBody`: The type of the response body returned by the route handler.
   * - `Locals`: The type of the `res.locals` object available in the route handler.
   * - `MetaResType`: Usually not specified by the user. If you dont know what it is, you don't need it.
   */
  with<
    ResBody,
    Locals extends Record<string, unknown> = Record<string, unknown>,
    MetaResType = unknown,
  >(): SchemaRouteAdder<ResBody, Locals, MetaResType, RouterWithSchema>;

  /**
   * Returns the underlying router instance used by the schema-enabled router.
   */
  getRouter(): routing.IRouter;
}

//#endregion Factory
