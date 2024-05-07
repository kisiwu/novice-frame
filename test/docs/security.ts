import { OAuth2Util, GrantType, BearerUtil, GroupAuthUtil } from '../../src';

export const oauth2 = new OAuth2Util('oauth2')
    .setGrantType(GrantType.passwordCredentials)
    .setDescription('This API uses OAuth 2 with the password grant flow. [More info](/docs/redoc)')
    .setAccessTokenUrl('/oauth2/token')
    .setScopes({
        read_pets: 'read your pets',
        write_pets: 'modify pets in your account'
    });
export const bearer = new BearerUtil('bearer')

export const security = new GroupAuthUtil([
    bearer,
    oauth2
]);