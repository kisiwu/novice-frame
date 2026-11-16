import { OIDCDeviceAuthorizationAuthUtil, OIDCSecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { type AnyExpressRequest, toWebStandardRequest, type WebStandardRequestOptions } from './utils';
import { type BaseAuthUtil } from '@novice1/api-doc-generator';
import type {
  OIDCDeviceAuthorizationFlow,
  DeviceAuthorizationEndpointContext,
  DeviceAuthorizationProcessResponse,
  DeviceAuthorizationEndpointResponse,
  DeviceAuthorizationGrantContext,
  OAuth2RefreshTokenGrantContext,
  OAuth2Error,
  OAuth2Client,
} from '@saurbit/oauth2';

//#region OIDC Device Authorization Security Shape

export type OIDCDeviceAuthorizationSecurityShapeOptions<
  F extends OIDCDeviceAuthorizationFlow = OIDCDeviceAuthorizationFlow,
> = OAuth2SecurityShapeOptions<F>;

/**
 * Security shape for handling OIDC Device Authorization flow authentication.
 */
export class OIDCDeviceAuthorizationSecurityShape<
  F extends OIDCDeviceAuthorizationFlow = OIDCDeviceAuthorizationFlow,
> extends OIDCSecurityShape<F> {
  scheme(): BaseAuthUtil {
    const docs = new OIDCDeviceAuthorizationAuthUtil(this.flow.getSecuritySchemeName())
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setAuthUrl(this.flow.getAuthorizationEndpoint());

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

  getVerificationEndpoint(): string {
    return this.flow.getVerificationEndpoint();
  }

  initiateToken(
    req: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Promise<
    | {
        success: true;
        context: DeviceAuthorizationGrantContext | OAuth2RefreshTokenGrantContext;
      }
    | {
        success: false;
        error: OAuth2Error;
      }
  > {
    return this.flow.initiateToken(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }

  processAuthorization(
    req: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Promise<DeviceAuthorizationProcessResponse<DeviceAuthorizationEndpointContext>> {
    return this.flow.processAuthorization(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }

  handleAuthorizationEndpoint(
    req: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Promise<DeviceAuthorizationEndpointResponse<DeviceAuthorizationEndpointContext>> {
    return this.flow.handleAuthorizationEndpoint(
      toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) })
    );
  }

  verifyUserCode(
    userCode: string,
    options?: WebStandardRequestOptions
  ): Promise<
    | {
        success: true;
        deviceCode: string;
        client: OAuth2Client;
      }
    | {
        success: false;
        error: OAuth2Error;
      }
  >;
  verifyUserCode(
    request: AnyExpressRequest,
    options?: WebStandardRequestOptions
  ): Promise<
    | {
        success: true;
        deviceCode: string;
        client: OAuth2Client;
      }
    | {
        success: false;
        error: OAuth2Error;
      }
  >;
  verifyUserCode(req: AnyExpressRequest | string, options?: WebStandardRequestOptions) {
    if (typeof req === 'string') {
      return this.flow.verifyUserCode(req);
    }
    return this.flow.verifyUserCode(toWebStandardRequest(req, { origin: this.getHost(), ...(options || {}) }));
  }
}
//#endregion OIDC Device Authorization Security Shape
