import { buildValueToValidate, compareOrder, isSchema, retrieveSchema, validate } from './helpers';
import type { ErrorRequestHandler, RequestHandler } from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import Extend from 'extend';

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
  return async function standardValidator(req, res, next) {
    try {
      const schema = retrieveSchema(req.meta?.parameters, schemaProperty);
      if (!schema) {
        // add a default validated function if it doesn't exist
        if (typeof (req as { validated?: () => unknown }).validated === 'undefined') {
          (req as { validated?: () => unknown }).validated = () => {};
        }
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
      const ordered = Object.keys(schema).sort(compareOrder);
      for (const key of ordered) {
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

export const standardValidator = validatorSchema(undefined, undefined, 'standardSchema');
