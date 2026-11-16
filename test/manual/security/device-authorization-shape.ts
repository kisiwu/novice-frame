import { DeviceAuthorizationAuthUtil, OAuth2SecurityShape, type OAuth2SecurityShapeOptions } from './security-shapes';
import { type AnyExpressRequest, toWebStandardRequest, type WebStandardRequestOptions } from './utils';
import { type BaseAuthUtil } from '@novice1/api-doc-generator';
import type {
  DeviceAuthorizationFlow,
  DeviceAuthorizationEndpointContext,
  DeviceAuthorizationProcessResponse,
  DeviceAuthorizationEndpointResponse,
  DeviceAuthorizationGrantContext,
  OAuth2RefreshTokenGrantContext,
  OAuth2Error,
  OAuth2Client,
} from '@saurbit/oauth2';

//#region Device Authorization Security Shape

export type DeviceAuthorizationSecurityShapeOptions<F extends DeviceAuthorizationFlow = DeviceAuthorizationFlow> =
  OAuth2SecurityShapeOptions<F>;

/**
 * Security shape for handling Device Authorization flow authentication.
 */
export class DeviceAuthorizationSecurityShape<
  F extends DeviceAuthorizationFlow = DeviceAuthorizationFlow,
> extends OAuth2SecurityShape<F> {
  protected currentScheme: BaseAuthUtil;

  constructor(options: DeviceAuthorizationSecurityShapeOptions<F>) {
    super(options);

    const docs = new DeviceAuthorizationAuthUtil(this.flow.getSecuritySchemeName())
      .setScopes(this.flow.getScopes() || {})
      .setAccessTokenUrl(this.flow.getTokenEndpoint())
      .setAuthUrl(this.flow.getAuthorizationEndpoint());

    const description = this.flow.getDescription();
    if (description) {
      docs.setDescription(description);
    }

    this.currentScheme = docs;
  }

  scheme(): BaseAuthUtil {
    return this.currentScheme;
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
//#endregion Device Authorization Security Shape
