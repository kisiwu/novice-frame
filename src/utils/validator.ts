import { Controller } from './routingUtils';
import type {
  ErrorRequestHandler,
  RequestHandler,
  Request,
  RouteSettings,
  MetaParameters,
  IRouter,
  IRoute,
} from '@novice1/routing';
// testing
import routing from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as core from 'express-serve-static-core';
import Extend from 'extend';
import { IncomingHttpHeaders } from 'node:http';
import QueryString, { ParsedQs } from 'qs';
import * as v from 'valibot';

const PARAMETERS_PROPS = ['params', 'body', 'query', 'headers', 'cookies', 'files'];
const orderMap = new Map(PARAMETERS_PROPS.map((item, index) => [item, index]));
function compareOrder(a: string, b: string): number {
  return (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0);
}

interface ValidationObject {
  params?: core.ParamsDictionary;
  body?: unknown;
  query?: ParsedQs;
  headers?: IncomingHttpHeaders;
  cookies?: unknown;
  files?: unknown;
}

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

type SchemaHandlers<
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
  QueryString.ParsedQs,
  Locals,
  MetaResType,
  ValidatedData<Settings['parameters']['standardSchema']>
>[];

function retrieveParametersValue(
  parameters?: Record<string, unknown>,
  property?: string
): Record<string, unknown> | null {
  let schemaFromParameters: Record<string, unknown> | null = null;
  if (parameters && typeof parameters === 'object') {
    schemaFromParameters = parameters;
    if (property && typeof property === 'string') {
      // retrieve nested object property
      const subParameters = property
        .replace(/\[([^[\]]*)\]/g, '.$1.')
        .split('.')
        .filter((t) => t !== '')
        .reduce((prev: unknown, curr) => {
          if (prev && typeof prev === 'object' && curr in prev) {
            const tmp: unknown = prev[curr as keyof typeof prev];
            return tmp;
          }
          return;
        }, schemaFromParameters);
      if (subParameters && typeof subParameters === 'object' && !Array.isArray(subParameters)) {
        schemaFromParameters = subParameters as Record<string, unknown>;
      } else {
        schemaFromParameters = null;
      }
    }
  }
  return schemaFromParameters;
}

function isSchema(x: unknown): x is StandardSchemaV1 {
  return !!(
    x &&
    typeof x === 'object' &&
    '~standard' in x &&
    x['~standard'] &&
    typeof x['~standard'] === 'object' &&
    'validate' in x['~standard'] &&
    typeof x['~standard']['validate'] === 'function'
  );
}

function retrieveSchema(
  parameters?: Record<string, unknown>,
  property?: string
): StandardSchemaV1 | StandardValidatorSchema | null {
  const v = retrieveParametersValue(parameters, property);

  // it is already a StandardSchemaV1 instance
  if (isSchema(v)) return v;

  if (!(v && typeof v === 'object' && !Array.isArray(v))) return null;

  const schema: Record<string, StandardSchemaV1> = {};
  PARAMETERS_PROPS.forEach((p) => {
    const currentSchemaValue = v[p];
    if (isSchema(currentSchemaValue)) {
      if (isSchema(currentSchemaValue)) schema[p] = currentSchemaValue;
    }
  });

  return Object.keys(schema).length ? schema : null;
}

function buildValueToValidate(schema: StandardSchemaV1 | StandardValidatorSchema, req: Request): ValidationObject {
  const r: ValidationObject = {}; //'params', 'body', 'query', 'headers', 'cookies', 'files'
  const isStandardSchema = isSchema(schema);
  if ((isStandardSchema || 'params' in schema) && typeof req.params !== 'undefined') {
    r.params = req.params;
  }
  if ((isStandardSchema || 'body' in schema) && typeof req.body !== 'undefined') {
    r.body = req.body;
  }
  if ((isStandardSchema || 'query' in schema) && typeof req.query !== 'undefined') {
    r.query = req.query;
  }
  if ((isStandardSchema || 'headers' in schema) && typeof req.headers !== 'undefined') {
    r.headers = req.headers;
  }
  if ((isStandardSchema || 'cookies' in schema) && typeof req.cookies !== 'undefined') {
    r.cookies = req.cookies;
  }
  if ((isStandardSchema || 'files' in schema) && typeof req.files !== 'undefined') {
    r.files = req.files;
  }
  return r;
}

async function validate<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
  options?: StandardSchemaV1.Options | undefined
): Promise<StandardSchemaV1.Result<unknown>> {
  return await schema['~standard'].validate(value, options);
}

export class ValidationError extends Error {
  readonly issues?: readonly StandardSchemaV1.Issue[];

  constructor(message: string, issues: readonly StandardSchemaV1.Issue[]) {
    super(`ValidationError: ${message}`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function validatorSchema(
  options?: StandardSchemaV1.Options | undefined,
  onerror?: ErrorRequestHandler | undefined,
  schemaProperty?: string | undefined
): RequestHandler {
  return async function (req, res, next) {
    try {
      const schema = retrieveSchema(req.meta?.parameters, schemaProperty);
      if (!schema) {
        return next();
      }
      const values = buildValueToValidate(schema, req);

      const propagateError = (err: ValidationError) =>
        typeof req.meta.parameters?.onerror === 'function'
          ? req.meta.parameters.onerror(err, req, res, next)
          : typeof onerror === 'function'
            ? onerror(err, req, res, next)
            : res.status(400).json(err);

      const propagateSuccess = (result: StandardSchemaV1.SuccessResult<unknown>) => {
        const { query: _query, ...validatedProps } = result.value as Record<PropertyKey, unknown>;
        (req as { validated?: () => unknown }).validated = () => result.value;
        Extend(req, validatedProps);
        return next();
      };

      if (isSchema(schema)) {
        const result = await validate(schema, values, req.meta.parameters?.standardValidatorOptions ?? options);
        if (result.issues) {
          return propagateError(new ValidationError('Validation failed', result.issues));
        }
        return propagateSuccess(result);
      }

      const fullResult: { value: Record<string, unknown> } = {
        value: {},
      };
      for (const key of Object.keys(schema).sort(compareOrder)) {
        const result = await validate(
          (schema as Record<string, StandardSchemaV1>)[key],
          (values as Record<string, unknown>)[key],
          req.meta.parameters?.standardValidatorOptions ?? options
        );
        if (result.issues) {
          return propagateError(new ValidationError(`Validation failed for ${key}`, result.issues));
        }
        fullResult.value[key] = result.value;
      }
      return propagateSuccess(fullResult);
    } catch (err) {
      next(err);
    }
  };
}

//#region route with standard schema

export interface ValidatorConfig {
  options?: StandardSchemaV1.Options | undefined;
  onerror?: ErrorRequestHandler | undefined;
}

export interface WithStandardSchema {
  parameters: MetaParameters & { standardSchema: StandardValidatorSchema };
}

export type SchemaRouteSettings<
  Path extends string,
  P = core.RouteParameters<Path>,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = WithStandardSchema & RouteSettings<Path, P, ResBody, unknown, QueryString.ParsedQs, Locals, MetaResType>;

export type SchemaRouteSettingsAnyPath<
  P = core.ParamsDictionary,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = WithStandardSchema & RouteSettings<core.PathParams, P, ResBody, unknown, QueryString.ParsedQs, Locals, MetaResType>;

export function withSchema<
  Path extends string,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType> =
    SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType> /*Controller<
    Settings['parameters']['standardSchema']['params'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['params']>
      : Settings['path'] extends string
        ? core.RouteParameters<Settings['path']>
        : core.ParamsDictionary,
    ResBody,
    Settings['parameters']['standardSchema']['body'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['body']>
      : unknown,
    QueryString.ParsedQs,
    Locals,
    MetaResType
  >[]*/
): IRoute<Path, MetaResType>;
export function withSchema<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettingsAnyPath<core.ParamsDictionary, ResBody, Locals, MetaResType> =
    SchemaRouteSettingsAnyPath<core.ParamsDictionary, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType> /*Controller<
    Settings['parameters']['standardSchema']['params'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['params']>
      : Settings['path'] extends string
        ? core.RouteParameters<Settings['path']>
        : core.ParamsDictionary,
    ResBody,
    Settings['parameters']['standardSchema']['body'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['body']>
      : unknown,
    QueryString.ParsedQs,
    Locals,
    MetaResType
  >[]*/
): IRoute;
export function withSchema<
  Path extends string,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType> =
    SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType> /*Controller<
    Settings['parameters']['standardSchema']['params'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['params']>
      : Settings['path'] extends string
        ? core.RouteParameters<Settings['path']>
        : core.ParamsDictionary,
    ResBody,
    Settings['parameters']['standardSchema']['body'] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<Settings['parameters']['standardSchema']['body']>
      : unknown,
    QueryString.ParsedQs,
    Locals,
    MetaResType
  >[]*/
): IRoute<Path, MetaResType> {
  router.setValidatorsIfNone(validatorSchema());
  const route = router.route(settings)[method](...(handlers as unknown as RequestHandler[]));
  return route;
}

function testValidator() {
  const bodySchema = v.object({
    artist: v.string(),
    title: v.string(),
    year: v.number(),
    genres: v.array(v.string()),
    songDurations: v.array(v.number()),
    outOfPublication: v.optional(v.boolean()),
  });
  withSchema(
    routing(),
    'post',
    {
      path: '/:file{.:ext}/*splat',
      //path: /\/example\//,
      parameters: {
        standardSchema: {
          body: bodySchema,
        },
      },
    },
    (req) => {
      const body = req.validated().body;
      const file = req.params.file;
      const ext = req.params.ext;
      const splat = req.params.splat;
      const artist = req.body.artist;
      const songDurations = req.body.songDurations;
      const outOfPublication = req.body.outOfPublication;
    }
  );
}

//#endregion route with standard schema
