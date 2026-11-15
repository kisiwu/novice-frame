import { AuthorizationCodeSecurityShape, RequestHandlerWithFlow } from './security';
import { toWebStandardRequest } from './security/utils';
import { controller } from '@novice1/frame';
import { HttpError } from '@novice1/frame/errors';
import { createWithSchema } from '@novice1/frame/validator';
import {
  type AppCredentials,
  type AuthCredentials,
  AuthorizationCodeFlow,
  AuthorizationCodeFlowBuilder,
  type UserCredentials,
} from '@saurbit/oauth2';
import { createInMemoryKeyStore, JoseJwksAuthority, JwksRotator } from '@saurbit/oauth2-jwt';
import { createHash } from 'node:crypto';

export type Session = AuthCredentials<UserCredentials, AppCredentials>;

const jwksStore = createInMemoryKeyStore();

// Signs JWTs and exposes the JWKS endpoint
const jwksAuthority = new JoseJwksAuthority(jwksStore, 8.64e6); // 100 days key lifetime

// Rotates keys and cleans up old ones
export const jwksRotator = new JwksRotator({
  keyGenerator: jwksAuthority,
  rotationTimestampStore: jwksStore,
  rotationIntervalMs: 7.884e9, // 91 days
});

const codeStorage: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string[];
    userId: string;
    expiresAt: number;
    codeChallenge?: string;
  }
> = new Map();

//#region Client Credentials Flow Configuration

/**
 * Client credentials flow configuration for the example client.
 */
const flow = new AuthorizationCodeFlowBuilder({
  securitySchemeName: 'clientCredentials',
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
    if (
      tokenRequest.grantType === 'authorization_code' &&
      tokenRequest.clientId === 'example-client' &&
      tokenRequest.code
    ) {
      const codeData = codeStorage.get(tokenRequest.code);
      if (!codeData) return undefined;
      if (codeData.clientId !== tokenRequest.clientId) return undefined;
      if (codeData.expiresAt < Date.now()) {
        codeStorage.delete(tokenRequest.code);
        return undefined;
      }

      if (tokenRequest.clientSecret) {
        // Private client: verify the secret
        if (tokenRequest.clientSecret !== 'example-secret') return undefined;
      } else if (tokenRequest.codeVerifier && codeData.codeChallenge) {
        // Public client: verify PKCE code_verifier against stored code_challenge
        const base64url = createHash('sha256').update(tokenRequest.codeVerifier).digest('base64url');

        if (base64url !== codeData.codeChallenge) return undefined;
      } else {
        return undefined;
      }

      return {
        id: 'example-client',
        grants: ['authorization_code'],
        redirectUris: ['http://localhost:3000/callback'],
        scopes: ['read', 'write'],
        metadata: {
          accessScope: codeData.scope,
          userId: codeData.userId,
          username: 'pico',
          userEmail: 'example@example.com',
          fullName: 'Example User',
        },
      };
    }
  })
  .generateAccessToken(async (grantContext) => {
    const accessScope = Array.isArray(grantContext.client.metadata?.accessScope)
      ? grantContext.client.metadata.accessScope
      : [];

    const registeredClaims = {
      exp: Math.floor(Date.now() / 1000) + grantContext.accessTokenLifetime,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      iss: grantContext.origin,
      aud: grantContext.client.id,
      jti: crypto.randomUUID(),
      sub: `${grantContext.client.metadata?.userId}`,
    };

    const { token: accessToken } = await jwksAuthority.sign({
      scope: accessScope.join(' '),
      ...registeredClaims,
    });

    const { token: idToken } = await jwksAuthority.sign({
      username: `${grantContext.client.metadata?.username}`,
      name: accessScope.includes('profile') ? `${grantContext.client.metadata?.userFullName}` : undefined,
      email: accessScope.includes('email') ? `${grantContext.client.metadata?.userEmail}` : undefined,
      nonce: grantContext.client.metadata?.nonce ? `${grantContext.client.metadata?.nonce}` : undefined,
      ...registeredClaims,
    });

    return {
      accessToken: accessToken,
      scope: accessScope,
    };
  })
  .verifyToken(async (request, { token }) => {
    // Implement logic to verify the access token.
    try {
      const payload = await jwksAuthority.verify(token);
      if (payload && payload.sub === 'example-user' && typeof payload.scope === 'string') {
        return {
          isValid: true,
          credentials: {
            user: {
              id: 'example-user',
              fullName: 'Example User',
              email: 'example@example.com',
              username: 'pico',
            },
            scope: payload.scope.split(' '),
          },
        };
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }
    return { isValid: false };
  })
  .getClientForAuthentication((data) => {
    if (data.clientId === 'example-client' && data.redirectUri === 'http://localhost:3000/callback') {
      return {
        id: 'example-client',
        grants: ['authorization_code'],
        redirectUris: ['http://localhost:3000/callback'],
        scopes: ['read', 'write'],
      };
    }
  })
  .getUserForAuthentication((ctxt, parsedData, request) => {
    if (parsedData.username === 'pico' && parsedData.password === 'belo') {
      return {
        type: 'authenticated',
        user: {
          id: 'example-user',
          fullName: 'Example User',
          email: 'example@example.com',
          username: 'pico',
        },
      };
    }
  })
  .generateAuthorizationCode((grantContext, user) => {
    if (!user.id) {
      return undefined;
    }
    const code = crypto.randomUUID();
    codeStorage.set(code, {
      redirectUri: grantContext.redirectUri,
      clientId: grantContext.client.id,
      scope: grantContext.scope,
      userId: `${user.id}`,
      expiresAt: Date.now() + 60000,
      codeChallenge: grantContext.codeChallenge,
    });
    return {
      type: 'code',
      code: code,
    };
  })
  .build();

//#endregion Client Credentials Flow Configuration

//#region Client Credentials Security Shape

/**
 * Security shape for handling client credentials flow authentication.
 */
export const clientCredentialsShape = new AuthorizationCodeSecurityShape({
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

//#region Token to Session Middleware

/**
 * Middleware that converts a verified token into a session attached to the request object.
 *
 * @param req The Express request object
 * @param res The Express response object
 * @param next The next middleware function
 * @returns void
 */
export const tokenToSessionMiddleware: RequestHandlerWithFlow<AuthorizationCodeFlow> = async (f, req, res, next) => {
  const result = await f.verifyToken(toWebStandardRequest(req));
  if (!result.success) {
    return next();
  }
  // Attach the verified credentials to the request object.
  (req as { auth?: Session }).auth = result.credentials;
  return next();
};

//#endregion Token to Session Middleware

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
export const flowRouter = createWithSchema()
  .post(
    {
      path: clientCredentialsShape.getTokenEndpoint(),
      parameters: { undoc: true }, // Mark this endpoint as undocumented
      schema: {},
    },
    async (req, res) => {
      try {
        const result = await clientCredentialsShape.token(req);

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
      path: flow.getAuthorizationEndpoint(),
      parameters: { undoc: true },
      schema: {},
    },
    async (req, res) => {
      // TODO: form
    }
  )
  .get(
    {
      path: flow.getAuthorizationEndpoint(),
      parameters: { undoc: true },
      schema: {},
    },
    async (req, res) => {
      // TODO: handle form submission
    }
  )
  .getRouter();

//#endregion Flow Router
