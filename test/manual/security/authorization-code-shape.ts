import { OAuth2SecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import {
  type BaseAuthUtil,
  ChallengeAlgorithm,
  ClientAuthentication,
  GrantType,
  OAuth2Util,
} from '@novice1/api-doc-generator';
import type { AuthorizationCodeFlow } from '@saurbit/oauth2';

//#region Authorization Code Security Shape

export type AuthorizationCodeSecurityShapeOptions<F extends AuthorizationCodeFlow = AuthorizationCodeFlow> =
  OAuth2SecurityShapeOptions<F>;

/**
 * Security shape for handling authorization code flow authentication.
 */
export class AuthorizationCodeSecurityShape<
  F extends AuthorizationCodeFlow = AuthorizationCodeFlow,
> extends OAuth2SecurityShape<F> {
  protected currentScheme: BaseAuthUtil;

  constructor(options: AuthorizationCodeSecurityShapeOptions<F>) {
    super(options);

    const docs = new OAuth2Util(this.flow.getSecuritySchemeName())
      .setGrantType(GrantType.authorizationCodeWithPkce)
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setRefreshUrl(this.flow.getTokenEndpoint())
      .setAuthUrl(this.flow.getAuthorizationEndpoint())
      .setChallengeAlgorithm(ChallengeAlgorithm.S256);

    const clientAuthentication = this.flow.getTokenEndpointAuthMethods();
    if (clientAuthentication.includes('client_secret_post')) {
      docs.setClientAuthentication(ClientAuthentication.body);
    } else {
      docs.setClientAuthentication(ClientAuthentication.header);
    }

    const description = this.flow.getDescription();

    if (description) {
      docs.setDescription(description);
    }

    this.currentScheme = docs;
  }

  scheme(): BaseAuthUtil {
    return this.currentScheme;
  }
}
//#endregion Authorization Code Security Shape
