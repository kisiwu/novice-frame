import type {
  HttpMethod,
  SchemaRouteSettings,
  SchemaRouteSettingsAnyPath,
  SchemaHandlers,
  SchemaSettings,
  RouterWithSchema,
} from './types';
import { validatorSchema } from './validator';
import type { IRouter, IRoute, RequestHandler } from '@novice1/routing';
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
): IRoute<Path, MetaResType>;
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
  method: HttpMethod,
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType>
): IRoute<Path, MetaResType> {
  router.setValidatorsIfNone(validatorSchema(undefined, undefined, 'standardSchema'));
  const route = router.route(settings)[method](...(handlers as unknown as RequestHandler[]));
  return route;
}

//#region Factory

/**
 * wish to be able to do something like:
 * const routerWithSchema = createWithSchema(myRouter);
 *
 * routerWithSchema
 * .route<ResBody, Locals, MetaResType>(
 *   'post',
 *   {
 *     path: '/example',
 *     schema: {
 *       query: myQuerySchema,
 *       body: myBodySchema,
 *     },
 *   },
 *   myHandler
 * )
 * .route<ResBody2, Locals, MetaResType>(
 *   'put',
 *   {
 *     path: '/another-example',
 *     schema: {
 *       body: myBodySchema,
 *     },
 *   },
 *   myHandler2,
 *   myHandler3
 * );
 *
 * // get back myRouter
 * const originalRouter = routerWithSchema.getRouter();
 *
 * So `.route()` returns the object for chaining further route definitions.
 * And a method tho retrieve the original router.
 */

export function createWithSchema<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(router: IRouter): RouterWithSchema<ResBody, Locals, MetaResType> {
  const wrapper = {
    route(
      method: HttpMethod,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: SchemaSettings<any, any, any, any, any>,
      ...handlers: unknown[]
    ) {
      const { schema, options, onerror, parameters, ...rest } = settings;
      router.setValidatorsIfNone(validatorSchema(undefined, undefined, 'standardSchema'));
      router
        .route({
          ...rest,
          parameters: { ...parameters, standardSchema: schema, standardValidatorOptions: options, onerror },
        })
        ?.[method](...(handlers as RequestHandler[]));
      return wrapper;
    },
    getRouter: () => router,
  };
  return wrapper as unknown as RouterWithSchema<ResBody, Locals, MetaResType>;
}

//#endregion Factory
