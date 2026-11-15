import { OAuth2SecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { AnyExpressRequest, toWebStandardRequest, WebStandardRequestOptions } from './utils';
import {
  type BaseAuthUtil,
  ChallengeAlgorithm,
  ClientAuthentication,
  GrantType,
  OAuth2Util,
} from '@novice1/api-doc-generator';
import type { AuthorizationCodeFlow, AuthorizationCodeReqData } from '@saurbit/oauth2';

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

  getAuthorizationEndpoint() {
    return this.flow.getAuthorizationEndpoint();
  }

  initiateAuthorization(req: AnyExpressRequest, options?: WebStandardRequestOptions) {
    return this.flow.initiateAuthorization(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }

  processAuthorization(req: AnyExpressRequest, reqData: AuthorizationCodeReqData, options?: WebStandardRequestOptions) {
    return this.flow.processAuthorization(
      toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }),
      reqData
    );
  }

  handleAuthorizationEndpoint(
    req: AnyExpressRequest,
    reqData: AuthorizationCodeReqData,
    options?: WebStandardRequestOptions
  ) {
    return this.flow.handleAuthorizationEndpoint(
      toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }),
      reqData
    );
  }
}
//#endregion Authorization Code Security Shape
