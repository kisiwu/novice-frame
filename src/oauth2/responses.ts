export type OAuth2Error = 'invalid_request' | 'invalid_client' | 'invalid_grant' | 'invalid_scope' | 'unauthorized_client' | 'unsupported_grant_type' | 'invalid_token'

export abstract class BaseOAuth2ErrorResponse {
    protected abstract error: OAuth2Error
    protected errorDescription?: string
    protected errorUri?: string

    constructor(errorDescription?: string, errorUri?: string) {
        this.errorDescription = errorDescription
        this.errorUri = errorUri
    }

    setErrorDescription(value?: string): BaseOAuth2ErrorResponse {
        this.errorDescription = value
        return this;
    }
    getErrorDescription(): string | undefined {
        return this.errorDescription;
    }

    setErrorUri(value?: string): BaseOAuth2ErrorResponse {
        this.errorUri = value
        return this;
    }
    getErrorUri(): string | undefined {
        return this.errorUri;
    }

    toObject(): {error: string, error_description?: string, error_uri?: string} {
        return {
            error: this.error,
            error_description: this.errorDescription,
            error_uri: this.errorUri
        }
    }

    toJSON(): {error: string, error_description?: string, error_uri?: string} {
        return this.toObject()
    }
}

export class OAuth2ErrorResponse extends BaseOAuth2ErrorResponse {

    protected error: OAuth2Error

    constructor(error: OAuth2Error, errorDescription?: string, errorUri?: string) {
        super(errorDescription, errorUri)
        this.error = error
    }
}

export class OAuth2InvalidRequestResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('invalid_request', errorDescription, errorUri)
    }
}

export class OAuth2InvalidClientResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('invalid_client', errorDescription, errorUri)
    }
}

export class OAuth2InvalidGrantResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('invalid_grant', errorDescription, errorUri)
    }
}

export class OAuth2InvalidScopeResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('invalid_scope', errorDescription, errorUri)
    }
}

export class OAuth2UnauthorizedClientResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('unauthorized_client', errorDescription, errorUri)
    }
}

export class OAuth2UnsupportedGrantTypeResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('unsupported_grant_type', errorDescription, errorUri)
    }
}

export class OAuth2InvalidTokenResponse extends OAuth2ErrorResponse {
    constructor(errorDescription?: string, errorUri?: string) {
        super('invalid_token', errorDescription, errorUri)
    }
}

export class OAuth2TokenResponse {

    protected accessToken: string
    protected tokenType: string
    /**
     * in seconds
     */
    protected expiresIn?: number
    protected refreshToken?: string
    protected scope?: string

    constructor(accessToken: string, tokenType: string) {
        this.accessToken = accessToken
        this.tokenType = tokenType
    }

    setAccessToken(value: string): OAuth2TokenResponse {
        this.accessToken = value
        return this;
    }
    getAccessToken(): string {
        return this.accessToken;
    }

    setTokenType(value: string): OAuth2TokenResponse {
        this.tokenType = value
        return this;
    }
    getTokenType(): string {
        return this.tokenType;
    }

    /**
     * @param value number of seconds
     */
    setExpiresIn(value?: number): OAuth2TokenResponse {
        this.expiresIn = value
        return this;
    }
    /**
     * @returns number of seconds
     */
    getExpiresIn(): number | undefined {
        return this.expiresIn;
    }

    setRefreshToken(value?: string): OAuth2TokenResponse {
        this.refreshToken = value
        return this;
    }
    getRefreshToken(): string | undefined {
        return this.refreshToken;
    }

    setScope(value?: string): OAuth2TokenResponse {
        this.scope = value
        return this;
    }
    getScope(): string | undefined {
        return this.scope;
    }

    toObject(): {access_token: string, token_type: string, expires_in?: number, refresh_token?: string, scope?: string} {
        return {
            access_token: this.accessToken,
            token_type: this.tokenType,
            expires_in: this.expiresIn,
            refresh_token: this.refreshToken,
            scope: this.scope,
        }
    }

    toJSON(): {access_token: string, token_type: string, expires_in?: number, refresh_token?: string, scope?: string} {
        return this.toObject()
    }
}