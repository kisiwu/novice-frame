import { OIDCAuthUtil, OIDCSecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { type AnyExpressRequest, toWebStandardRequest, type WebStandardRequestOptions } from './utils';
import { type BaseAuthUtil, ChallengeAlgorithm, ClientAuthentication, GrantType } from '@novice1/api-doc-generator';
import type {
  OIDCAuthorizationCodeFlow,
  AuthorizationCodeReqData,
  OIDCAuthorizationCodeInitiationResponse,
  OIDCAuthorizationCodeProcessResponse,
  OIDCAuthorizationCodeEndpointResponse,
} from '@saurbit/oauth2';

//#region OIDC Authorization Code Security Shape

export type OIDCAuthorizationCodeSecurityShapeOptions<F extends OIDCAuthorizationCodeFlow = OIDCAuthorizationCodeFlow> =
  OAuth2SecurityShapeOptions<F>;

/**
 * Security shape for handling OIDC Authorization Code flow authentication.
 */
export class OIDCAuthorizationCodeSecurityShape<
  F extends OIDCAuthorizationCodeFlow = OIDCAuthorizationCodeFlow,
> extends OIDCSecurityShape<F> {
  scheme(): BaseAuthUtil {
    const docs = new OIDCAuthUtil(this.flow.getSecuritySchemeName())
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
    const host = this.getHost();
    if (description) {
      docs.setDescription(description);
    }
    if (host) {
      docs.setHost(host);
    }

    return docs;
  }

  getAuthorizationEndpoint(): string {
    return this.flow.getAuthorizationEndpoint();
  }

  initiateAuthorization(
    req: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Promise<OIDCAuthorizationCodeInitiationResponse> {
    return this.flow.initiateAuthorization(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }

  processAuthorization(
    req: AnyExpressRequest,
    reqData: AuthorizationCodeReqData,
    options?: WebStandardRequestOptions
  ): Promise<OIDCAuthorizationCodeProcessResponse> {
    return this.flow.processAuthorization(
      toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }),
      reqData
    );
  }

  handleAuthorizationEndpoint(
    req: AnyExpressRequest,
    reqData: AuthorizationCodeReqData,
    options?: WebStandardRequestOptions
  ): Promise<OIDCAuthorizationCodeEndpointResponse> {
    return this.flow.handleAuthorizationEndpoint(
      toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }),
      reqData
    );
  }
}
//#endregion OIDC Authorization Code Security Shape
