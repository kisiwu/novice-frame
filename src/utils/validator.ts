import { ErrorRequestHandler, RequestHandler, Request } from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ParamsDictionary } from 'express-serve-static-core';
import Extend from 'extend';
import { IncomingHttpHeaders } from 'node:http';
import { ParsedQs } from 'qs';

const PARAMETERS_PROPS = ['params', 'body', 'query', 'headers', 'cookies', 'files'];

const orderMap = new Map(PARAMETERS_PROPS.map((item, index) => [item, index]));

function compareOrder(a: string, b: string): number {
  return (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0);
}

interface ValidationObject {
  params?: ParamsDictionary;
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

export interface ValidatedFunction {
  <Q = Record<string, unknown>, P = unknown, B = unknown, H = unknown, C = unknown, F = unknown>(): {
    query?: Q;
    params?: P;
    body?: B;
    headers?: H;
    cookies?: C;
    files?: F;
    [x: string]: unknown;
  };
}

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
        req.validated = (() => result.value) as ValidatedFunction;
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

      for (const key of Object.keys(schema).sort(compareOrder)) {
        const result = await validate(
          (schema as Record<string, StandardSchemaV1>)[key],
          (values as Record<string, unknown>)[key],
          req.meta.parameters?.standardValidatorOptions ?? options
        );
        if (result.issues) {
          return propagateError(new ValidationError(`Validation failed for ${key}`, result.issues));
        }
        return propagateSuccess(result);
      }
      return next();
    } catch (err) {
      next(err);
    }
  };
}
