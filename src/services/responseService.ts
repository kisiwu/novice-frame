// services/responseService

import { 
    OAuth2InvalidClientResponse, 
    OAuth2InvalidGrantResponse, 
    OAuth2InvalidRequestResponse, 
    OAuth2InvalidScopeResponse, 
    OAuth2InvalidTokenResponse, 
    OAuth2TokenResponse, 
    OAuth2UnauthorizedClientResponse, 
    OAuth2UnsupportedGrantTypeResponse 
} from '../security'

 
export class ResponseService {
    static token(accessToken: string, tokenType: string) {
        return new OAuth2TokenResponse(accessToken, tokenType)
    }

    static invalidToken(errorDescription?: string, errorUri?: string) {
        return new OAuth2InvalidTokenResponse(errorDescription, errorUri)
    }

    static unauthorizedClient(errorDescription?: string, errorUri?: string) {
        return new OAuth2UnauthorizedClientResponse(errorDescription, errorUri)
    }

    static unsupportedGrantType(errorDescription?: string, errorUri?: string) {
        return new OAuth2UnsupportedGrantTypeResponse(errorDescription, errorUri)
    }

    static invalidScope(errorDescription?: string, errorUri?: string) {
        return new OAuth2InvalidScopeResponse(errorDescription, errorUri)
    }

    static invalidGrant(errorDescription?: string, errorUri?: string) {
        return new OAuth2InvalidGrantResponse(errorDescription, errorUri)
    }

    static invalidClient(errorDescription?: string, errorUri?: string) {
        return new OAuth2InvalidClientResponse(errorDescription, errorUri)
    }

    static invalidRequest(errorDescription?: string, errorUri?: string) {
        return new OAuth2InvalidRequestResponse(errorDescription, errorUri)
    }
}