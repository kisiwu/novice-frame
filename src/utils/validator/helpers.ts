import { StandardValidatorSchema } from './types';
import type { Request } from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as core from 'express-serve-static-core';
import type { IncomingHttpHeaders } from 'node:http';
import type { ParsedQs } from 'qs';

interface ValidationObject {
  params?: core.ParamsDictionary;
  body?: unknown;
  query?: ParsedQs;
  headers?: IncomingHttpHeaders;
  cookies?: unknown;
  files?: unknown;
}

const PARAMETERS_PROPS = ['params', 'body', 'query', 'headers', 'cookies', 'files'];
const orderMap = new Map(PARAMETERS_PROPS.map((item, index) => [item, index]));

export function compareOrder(a: string, b: string): number {
  return (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0);
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

export function isSchema(x: unknown): x is StandardSchemaV1 {
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

export function retrieveSchema(
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

export function buildValueToValidate(
  schema: StandardSchemaV1 | StandardValidatorSchema,
  req: Request
): ValidationObject {
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

export async function validate<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
  options?: StandardSchemaV1.Options | undefined
): Promise<StandardSchemaV1.Result<unknown>> {
  return await schema['~standard'].validate(value, options);
}
