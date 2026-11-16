import { AnyExpressRequest, toWebStandardRequest, WebStandardRequestOptions } from './utils';
import { OAuth2Util, type BaseAuthUtil, type SecuritySchemeObject } from '@novice1/api-doc-generator';
import type { ISecurityShape } from '@novice1/frame';
import type routing from '@novice1/routing';
import type { OAuth2Flow, OAuth2FlowTokenResponse, OIDCFlow } from '@saurbit/oauth2';
import type { RequestHandler } from 'express';

//#region Types for request handlers with flow

export type RequestHandlerWithFlow<F extends OAuth2Flow = OAuth2Flow> = (
  ...args: [F, ...Parameters<RequestHandler>]
) => ReturnType<RequestHandler>;

export type AuthHandlerWithFlow<F extends OAuth2Flow = OAuth2Flow> = (
  ...args: [F, ...Parameters<routing.RequestHandler>]
) => ReturnType<routing.RequestHandler>;

//#endregion Types for request handlers with flow

//#region Security Shapes

export interface OAuth2SecurityShapeOptions<F extends OAuth2Flow = OAuth2Flow> {
  /**
   * The flow instance used by this security shape.
   */
  flow: F;
  /**
   * Handler for authorization.
   */
  authHandler: AuthHandlerWithFlow<F>;
  /**
   * Can be used to convert a verified token into a session attached to the request object.
   */
  middleware?: RequestHandlerWithFlow<F>;

  host?: string;
}

export abstract class OAuth2SecurityShape<F extends OAuth2Flow = OAuth2Flow> implements ISecurityShape {
  protected readonly _flow: F;
  protected readonly authHandler: AuthHandlerWithFlow<F>;
  protected readonly middleware?: RequestHandlerWithFlow<F>;
  protected host?: string;

  get flow(): F {
    return this._flow;
  }

  constructor(options: OAuth2SecurityShapeOptions<F>) {
    this._flow = options.flow;
    this.authHandler = options.authHandler;
    this.middleware = options.middleware;
    this.host = options.host;
  }

  abstract scheme(): BaseAuthUtil;

  /**
   * Optional: define the routes that generate the API key
   */
  //router(): routing.IRouter {
  //    return routing()
  //}

  /**
   * @returns An array of request handlers for the authorization middleware
   */
  authHandlers(): routing.RequestHandler[] {
    return [this.authHandler.bind(this, this.flow)];
  }

  /**
   *
   * @returns An array of Express request handlers for the middleware
   */
  middlewares(): RequestHandler[] {
    return this.middleware ? [this.middleware.bind(this, this.flow)] : [];
  }

  toOpenAPISecurity(scopes?: string[] | undefined) {
    return this.scheme().toOpenAPISecurity(scopes);
  }

  getHost(): string | undefined {
    return this.host;
  }

  setHost(host: string): this {
    this.host = host;
    return this;
  }

  getTokenEndpoint(): string {
    return this.flow.getTokenEndpoint();
  }

  token(req: AnyExpressRequest, options?: WebStandardRequestOptions): Promise<OAuth2FlowTokenResponse> {
    return this.flow.token(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }
}

export abstract class OIDCSecurityShape<F extends OIDCFlow = OIDCFlow> extends OAuth2SecurityShape<F> {
  getDiscoveryConfiguration(
    req?: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Record<string, string | string[] | undefined> {
    return this.flow.getDiscoveryConfiguration(
      req ? toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }) : undefined
    );
  }

  getDiscoveryEndpoint(): string {
    const discoveryUrl = this.flow.getDiscoveryUrl();
    try {
      const parsed = new URL(discoveryUrl, 'http://placeholder.local');
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return discoveryUrl;
    }
  }

  getJwksEndpoint(): string | undefined {
    return this.flow.getJwksEndpoint();
  }
}

//#endregion Security Shapes

//#region Doc Generator utilities

export class OIDCAuthUtil extends OAuth2Util {
  protected discoveryUrl?: string;

  setDiscoveryUrl(url: string): this {
    this.discoveryUrl = url;
    return this;
  }

  getDiscoveryUrl(): string | undefined {
    return this.discoveryUrl;
  }

  toOpenAPI(): Record<string, SecuritySchemeObject> {
    const discoveryUrl = this.getDiscoveryUrl() || '/.well-known/openid-configuration';
    const host = this.getHost();
    let openIdConnectUrl = discoveryUrl;
    if (/^(?:[a-zA-Z][a-zA-Z\d+\-.]*:)?\/\/[^/?#\s]+/.test(discoveryUrl)) {
      openIdConnectUrl = discoveryUrl;
    } else if (host) {
      openIdConnectUrl = new URL(discoveryUrl, host).toString();
      //openIdConnectUrl = `${host}${discoveryUrl}`;
    }
    return {
      [this.securitySchemeName]: {
        type: 'openIdConnect',
        openIdConnectUrl: openIdConnectUrl,
      },
    };
  }
}

//#endregion Doc Generator utilities
