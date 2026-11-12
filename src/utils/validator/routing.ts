import type {
  HttpMethod,
  SchemaRouteSettings,
  SchemaRouteSettingsAnyPath,
  SchemaHandlers,
  WithSchemaFn,
  SchemaSettings,
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
 * withSchema<ResBody, Locals, MetaResType>(myRouter, 'get', {
 *   path: '/example',
 *   schema: {
 *     query: myQuerySchema,
 *     body: myBodySchema,
 *   },
 * }, myHandler);
 *
 * We want to be able to define the ResBody, Locals and MetaResTypes first in the generic parameters of the withSchema function.
 * Writing another function that helps us do that is also an option
 */

export function createWithSchema<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(): WithSchemaFn<ResBody, Locals, MetaResType> {
  return ((
    router: IRouter,
    method: HttpMethod,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings: SchemaSettings<any, any, any, any, any>,
    ...handlers: unknown[]
  ) => {
    const { schema, options, onerror, parameters, ...rest } = settings;
    router.setValidatorsIfNone(validatorSchema(undefined, undefined, 'standardSchema'));
    return router
      .route({
        ...rest,
        parameters: { ...parameters, standardSchema: schema, standardValidatorOptions: options, onerror },
      })
      ?.[method](...(handlers as RequestHandler[]));
  }) as WithSchemaFn<ResBody, Locals, MetaResType>;
}

//#endregion Factory
