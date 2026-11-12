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
