import { toWebRequest } from './utils';
import { BaseAuthUtil, GrantType, OAuth2Util } from '@novice1/api-doc-generator';
import type { ISecurityShape } from '@novice1/frame';
import type { RequestHandler } from '@novice1/routing';
import type { ClientCredentialsFlow, StrategyResult } from '@saurbit/oauth2';

/*
export type RequestHandlerWithStrategyHandler = (
  ...args: [...Parameters<RequestHandler>, StrategyResult]
) => ReturnType<RequestHandler>;
*/

/**
 * Security shape for handling client credentials flow authentication.
 */
export class ClientCredentialsSecurityShape implements ISecurityShape {
  constructor(
    public readonly flow: ClientCredentialsFlow,
    protected authHandler: RequestHandler
  ) {}

  /**
   * Optional: define the routes that generate the API key
   */
  //router(): routing.IRouter {
  //    return routing()
  //}

  scheme(): BaseAuthUtil {
    const docs = new OAuth2Util(this.flow.getSecuritySchemeName())
      .setGrantType(GrantType.clientCredentials)
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setRefreshUrl(this.flow.getTokenEndpoint());

    const description = this.flow.getDescription();

    if (description) {
      docs.setDescription(description);
    }

    return docs;
  }

  /**
   * @returns Middlewares that give authorization
   */
  authHandlers(): RequestHandler[] {
    return [this.authHandler];
  }
}
