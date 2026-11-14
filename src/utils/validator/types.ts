import type { Controller } from '../routingUtils';
import type { ErrorRequestHandler, RouteSettings } from '@novice1/routing';
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

//#region Factory

type OutputOf<S, K extends string, Fallback> = S extends { [P in K]: infer T }
  ? T extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<T>
    : Fallback
  : Fallback;

export type RouterMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export type SchemaMethodSettings<
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

export type SchemaRouteSettings<
  Path,
  S extends StandardValidatorSchema,
  ResBody,
  Locals extends Record<string, unknown>,
  MetaResType,
> = SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType> & { method: RouterMethod };

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

/**
 * Represents an object that can add schema-based routes to a router.
 * Provides the `route` method to define routes with request validation and type-safe handlers.
 */
export interface SchemaRouteAdder<ResBody, Locals extends Record<string, unknown>, MetaResType, Next> {
  route<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaRouteSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  route<S extends StandardValidatorSchema>(
    settings: SchemaRouteSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  all<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  all<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  head<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  head<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  get<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  get<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  post<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  post<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  put<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  put<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  delete<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  delete<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  patch<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  patch<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<core.PathParams, S, ResBody, Locals, MetaResType>
  ): Next;
  options<Path extends string, S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<Path, S, ResBody, Locals, MetaResType>,
    ...handlers: SchemaHandlersFor<Path, S, ResBody, Locals, MetaResType>
  ): Next;
  options<S extends StandardValidatorSchema>(
    settings: SchemaMethodSettings<core.PathParams, S, ResBody, Locals, MetaResType>,
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
   *
   * #### Example usage:
   * ```ts
   * const routerWithSchema = createWithSchema(myRouter);
   *
   * routerWithSchema
   *   .with<{ ok: boolean }>()
   *   .route(
   *     {
   *       path: '/example',
   *       method: 'post',
   *       schema: { body: myBodySchema }
   *     },
   *     (req) => {
   *       return { ok: true };
   *     }
   *   );
   * ```
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
