import type { SchemaRouteSettings, SchemaRouteSettingsAnyPath, SchemaHandlers } from './types';
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
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
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
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
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
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head',
  settings: Settings,
  ...handlers: SchemaHandlers<Settings, ResBody, Locals, MetaResType>
): IRoute<Path, MetaResType> {
  router.setValidatorsIfNone(validatorSchema());
  const route = router.route(settings)[method](...(handlers as unknown as RequestHandler[]));
  return route;
}
