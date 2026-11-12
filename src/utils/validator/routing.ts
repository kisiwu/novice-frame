import { controller } from '../routingUtils';
import type {
  HttpMethod,
  SchemaRouteSettings,
  SchemaRouteSettingsAnyPath,
  SchemaHandlers,
  SchemaSettings,
  RouterWithSchema,
} from './types';
import { validatorSchema } from './validator';
import type { IRouter, RequestHandler } from '@novice1/routing';
import type * as core from 'express-serve-static-core';

export function withSchema<
  Path extends string,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType> =
    SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: HttpMethod,
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType>
): IRouter;
export function withSchema<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettingsAnyPath<core.ParamsDictionary, ResBody, Locals, MetaResType> =
    SchemaRouteSettingsAnyPath<core.ParamsDictionary, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: HttpMethod,
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType>
): IRouter;
export function withSchema<
  Path extends string,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
  Settings extends SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType> =
    SchemaRouteSettings<Path, core.RouteParameters<Path>, ResBody, Locals, MetaResType>,
>(
  router: IRouter,
  method: HttpMethod,
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType>
): IRouter {
  router.setValidatorsIfNone(validatorSchema(undefined, undefined, 'standardSchema'));
  router[method](settings, ...(handlers as unknown as RequestHandler[]).map((h) => controller(h)));
  return router;
}

//#region Factory

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
 *   'post',
 *   {
 *     path: '/example',
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
export function createWithSchema(router: IRouter): RouterWithSchema {
  const wrapper = {
    route(
      method: HttpMethod,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: SchemaSettings<any, any, any, any, any>,
      ...handlers: unknown[]
    ) {
      const { schema, options, onerror, parameters, ...rest } = settings;
      router.setValidators(validatorSchema(undefined, undefined, 'standardSchema'));
      router[method](
        {
          ...rest,
          parameters: { ...parameters, standardSchema: schema, standardValidatorOptions: options, onerror },
        },
        ...(handlers as RequestHandler[]).map((h) => controller(h))
      );
      return wrapper;
    },
    with: () => ({ route: wrapper.route }),
    getRouter: () => router,
  };
  return wrapper as unknown as RouterWithSchema;
}

//#endregion Factory
