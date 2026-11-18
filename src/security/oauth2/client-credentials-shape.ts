import { OAuth2SecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { type BaseAuthUtil, GrantType, OAuth2Util } from '@novice1/api-doc-generator';
import type { ClientCredentialsFlow } from '@saurbit/oauth2';

//#region Client Credentials Security Shape

export type ClientCredentialsSecurityShapeOptions<F extends ClientCredentialsFlow = ClientCredentialsFlow> =
  OAuth2SecurityShapeOptions<F>;

/**
 * Security shape for handling client credentials flow authentication.
 */
export class ClientCredentialsSecurityShape<
  F extends ClientCredentialsFlow = ClientCredentialsFlow,
> extends OAuth2SecurityShape<F> {
  protected currentScheme: BaseAuthUtil;

  constructor(options: ClientCredentialsSecurityShapeOptions<F>) {
    super(options);

    const docs = new OAuth2Util(this.flow.getSecuritySchemeName())
      .setGrantType(GrantType.clientCredentials)
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setRefreshUrl(this.flow.getTokenEndpoint());

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
//#endregion Client Credentials Security Shape
