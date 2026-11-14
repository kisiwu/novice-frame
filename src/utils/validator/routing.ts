import { controller } from '../routingUtils';
import type { RouterWithSchema, SchemaMethodSettings, SchemaRouteSettings } from './types';
import { standardValidator } from './validator';
import type { IRouter, RequestHandler } from '@novice1/routing';
import routing from '@novice1/routing';

//#region Factory

const methods = ['all', 'head', 'get', 'post', 'put', 'delete', 'patch', 'options'] as const;

/**
 * Creates a wrapper around the given router that allows defining routes with schema validation.
 * The returned wrapper provides a `.route()` method for defining routes with schema validation,
 * a `.with()` method for chaining route definitions, and a `.getRouter()` method to retrieve the original router.
 *
 * Example usage:
 * ```ts
 * const routerWithSchema = createWithSchema(myRouter);
 *
 * routerWithSchema.route(
 *   {
 *     path: '/example',
 *     method: 'post',
 *     schema: { body: myBodySchema }
 *   },
 *   myHandler
 * );
 *
 * const originalRouter = routerWithSchema.getRouter();
 * ```
 *
 * @param router
 * @returns
 */
export function createWithSchema(router: IRouter = routing()): RouterWithSchema {
  const adder = {
    route(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: SchemaRouteSettings<any, any, any, any, any>,
      ...handlers: unknown[]
    ) {
      const { method, schema, options, onerror, parameters, ...rest } = settings;
      router[method](
        {
          ...rest,
          parameters: { ...parameters, standardSchema: schema, standardValidatorOptions: options, onerror },
        },
        ...(handlers as RequestHandler[]).map((h) => controller(h))
      );
      router.setValidatorsIfNone(standardValidator);
      return wrapper;
    },
    ...Object.fromEntries(
      methods.map((m) => [
        m,
        (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          settings: SchemaMethodSettings<any, any, any, any, any>,
          ...handlers: unknown[]
        ) => wrapper.route({ ...settings, method: m }, ...handlers),
      ])
    ),
  };
  const wrapper = {
    ...adder,
    with: () => ({ ...adder }),
    getRouter: () => router,
  };
  return wrapper as unknown as RouterWithSchema;
}

//#endregion Factory
