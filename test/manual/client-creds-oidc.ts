import { OIDCClientCredentialsSecurityShape } from './security';
import { toWebStandardRequest } from './security/utils';
import { controller } from '@novice1/frame';
import { HttpError } from '@novice1/frame/errors';
import routing from '@novice1/routing';
import {
  type AppCredentials,
  type AuthCredentials,
  OIDCClientCredentialsFlowBuilder,
  type UserCredentials,
} from '@saurbit/oauth2';

export type Session = AuthCredentials<UserCredentials, AppCredentials>;

const sessions: Map<string, Session> = new Map();

//#region Client Credentials Flow Configuration

/**
 * Client credentials flow configuration for the example client.
 */
const flow = new OIDCClientCredentialsFlowBuilder({
  securitySchemeName: 'oidcClientCredentials',
  accessTokenLifetime: 900, // 15 minutes in seconds
  description: 'Client credentials flow for example client',
  scopes: {
    read: 'Read access to resources',
    write: 'Write access to resources',
  },
  tokenEndpoint: '/oauth2/token',
})
  .clientSecretBasicAuthenticationMethod()
  .getClient((tokenRequest) => {
    // Look up the client by ID/secret and return it, or undefined if not found.
    if (tokenRequest.clientId !== 'example-client' || tokenRequest.clientSecret !== 'example-secret') {
      return undefined;
    }
    return {
      grants: ['client_credentials'],
      id: 'example-client',
      secret: 'example-secret',
      redirectUris: [],
      scopes: ['read', 'write'],
    };
  })
  .generateAccessToken((grantContext) => {
    // Generate and return an access token string for the authenticated client.
    const token = 'valid-token';
    sessions.set(token, { app: { clientId: grantContext.client.id }, scope: grantContext.scope });
    return token;
  })
  .verifyToken((request, { token }) => {
    // Implement logic to verify the access token.
    if (sessions.has(token)) {
      return { isValid: true, credentials: sessions.get(token) };
    }
    return { isValid: false };
  })
  .build();

//#endregion Client Credentials Flow Configuration

//#region Client Credentials Security Shape

/**
 * Security shape for handling client credentials flow authentication.
 */
export const mySecurityShape = new OIDCClientCredentialsSecurityShape({
  host: 'http://localhost:3000',
  flow,
  authHandler: (_, req, res, next) => {
    // Check if the token verification was successful.
    if ('auth' in req && req.auth) {
      return next();
    }
    return res.status(401).send('Unauthorized');
  },
  middleware: async (_, req, _res, next) => {
    // Verify the token from the request
    const result = await flow.verifyToken(toWebStandardRequest(req));
    if (!result.success) {
      return next();
    }
    // Attach the verified credentials to the request object.
    (req as { auth?: Session }).auth = result.credentials;
    return next();
  },
});

//#endregion Client Credentials Security Shape

//#region Required Scopes Middleware

/**
 * Middleware that enforces the required scopes for accessing a resource.
 *
 * @param scopes The required scopes for accessing the resource
 * @returns An Express middleware function that enforces the required scopes
 */
export function requiredScopesMiddleware(scopes: string[]) {
  return controller<any, any>(async (req, res, next) => {
    const auth = (req as { auth?: Session }).auth;
    if (!auth) {
      return res.status(401).json({
        label: 'Unauthorized',
        message: 'Missing session',
        error: 'unauthorized',
        error_description: 'Missing session',
      });
    }
    // check session.role.permissions
    if (auth?.scope && !scopes.some((scope) => !auth?.scope?.includes(scope))) {
      return next();
    } else {
      const message = 'The token does not have the required permissions to access this resource.';
      return res.status(403).json({
        label: 'Forbidden',
        message,
        error: 'insufficient_scope',
        error_description: message,
      });
    }
  });
}

//#endregion Required Scopes Middleware

//#region App and User Session Middleware

export const isAppSessionMiddleware = controller<any, any>(async (req, res, next) => {
  const auth = (req as { auth?: Session }).auth;
  if (!auth?.app) {
    return res.status(401).json({
      label: 'Unauthorized',
      message: 'Missing session',
      error: 'unauthorized',
      error_description: 'Missing session',
    });
  }
  return next();
});

export const isUserSessionMiddleware = controller<any, any>(async (req, res, next) => {
  const auth = (req as { auth?: Session }).auth;
  if (!auth?.user) {
    return res.status(401).json({
      label: 'Unauthorized',
      message: 'Missing session',
      error: 'unauthorized',
      error_description: 'Missing session',
    });
  }
  return next();
});

//#endregion App and User Session Middleware

//#region Flow Router

/**
 * Router for handling client credentials flow endpoints.
 * This includes the token endpoint for obtaining access tokens.
 */
mySecurityShape
  .getOrCreateRouter()
  .post(
    {
      path: mySecurityShape.getTokenEndpoint(),
      parameters: { undoc: true }, // Mark this endpoint as undocumented
    },
    async (req, res) => {
      try {
        const result = await mySecurityShape.token(req);

        if (!result.success) {
          return res.status(result.error.statusCode ?? 400).json({
            error: result.error.errorCode,
            error_description: result.error.message,
          });
        } else {
          return res.status(200).json(result.tokenResponse);
        }
      } catch (err) {
        console.error(err);
        throw new HttpError(err instanceof Error ? err.message : 'Internal Server Error');
      }
    }
  )
  .get(
    {
      path: mySecurityShape.getDiscoveryEndpoint(),
      parameters: { undoc: true }, // Mark this endpoint as undocumented
    },
    async (req, res) => {
      try {
        const result = mySecurityShape.getDiscoveryConfiguration(req, { origin: req.headers.origin }); // to overwrite the default host with the request's origin
        return res.status(200).json(result);
      } catch (err) {
        console.error(err);
        throw new HttpError(err instanceof Error ? err.message : 'Internal Server Error');
      }
    }
  );

//#endregion Flow Router
