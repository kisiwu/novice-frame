import { 
    OAuth2ACPad,
    OAuth2ClientCredsPad, 
    OAuth2PasswordPad
} from './oauth2'

export * from './pads'
export * from './oauth2'

export class Oauth2SecurityPads {
    static get authorizationCode() {
        return OAuth2ACPad
    }

    static get clientCredentials() {
        return OAuth2ClientCredsPad
    }

    static get password() {
        return OAuth2PasswordPad
    }
}

export class SecurityPads {
    static get oauth2() {
        return Oauth2SecurityPads
    }
}