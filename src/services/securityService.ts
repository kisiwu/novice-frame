// services/securityService

import { 
    OAuth2ACAuthorizationRoute, 
    OAuth2ACShape, 
    OAuth2ACTokenRoute, 
    OAuth2ClientCredsShape, 
    OAuth2ClientCredsTokenRoute, 
    OAuth2PasswordShape, 
    OAuth2PasswordTokenRoute, 
    OAuth2RefreshTokenRoute 
} from '../security'

// SHAPES

export class OAuth2SecurityShapes {
    static get authorizationCode() {
        return OAuth2ACShape
    }

    static get clientCredentials() {
        return OAuth2ClientCredsShape
    }

    static get password() {
        return OAuth2PasswordShape
    }
}

export class SecurityShapes {
    static get oauth2() {
        return OAuth2SecurityShapes
    }
}

// ROUTES

export class OAuth2SecurityRoutes {
    static get refreshToken() {
        return OAuth2RefreshTokenRoute
    }

    static get authorizationCode() {
        return {
            authorization: OAuth2ACAuthorizationRoute,
            token: OAuth2ACTokenRoute
        }
    }

    static get clientCredentials() {
        return {
            token: OAuth2PasswordTokenRoute
        }
    }

    static get password() {
        return {
            token: OAuth2ClientCredsTokenRoute
        }
    }
}

export class SecurityRoutes {
    static get oauth2() {
        return OAuth2SecurityRoutes
    }
}

// SERVICE

export class SecurityService {
    static get shapes() {
        return SecurityShapes
    }

    static get routes() {
        return SecurityRoutes
    }
}
