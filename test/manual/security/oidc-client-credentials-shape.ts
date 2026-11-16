import { OIDCAuthUtil, OIDCSecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { type BaseAuthUtil, GrantType } from '@novice1/api-doc-generator';
import type { OIDCClientCredentialsFlow } from '@saurbit/oauth2';

//#region OIDC Client Credentials Security Shape

export type OIDCClientCredentialsSecurityShapeOptions<F extends OIDCClientCredentialsFlow = OIDCClientCredentialsFlow> =
  OAuth2SecurityShapeOptions<F> & {
    host?: string;
  };

/**
 * Security shape for handling client credentials flow authentication.
 */
export class OIDCClientCredentialsSecurityShape<
  F extends OIDCClientCredentialsFlow = OIDCClientCredentialsFlow,
> extends OIDCSecurityShape<F> {
  scheme(): BaseAuthUtil {
    const docs = new OIDCAuthUtil(this.flow.getSecuritySchemeName())
      .setGrantType(GrantType.clientCredentials)
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setRefreshUrl(this.flow.getTokenEndpoint())
      .setDiscoveryUrl(this.flow.getDiscoveryUrl());

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
}
//#endregion OIDC Client Credentials Security Shape
