# @novice1/frame

Web framework for building APIs, with built-in OpenAPI / Postman documentation, standard-schema validation and OAuth2 / OpenID Connect security.

Based on [@novice1/app](https://www.npmjs.com/package/@novice1/app) and [Express](https://expressjs.com/) 5.

## Installation

```bash
npm i @novice1/frame @novice1/routing express
```

Optional packages:

```bash
# Swagger UI documentation page
npm i swagger-ui-express
npm i -D @types/swagger-ui-express

# OAuth2 / OpenID Connect security shapes
npm i @saurbit/oauth2
```

## Package entry points

| Import                   | Content                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `@novice1/frame`         | `Frame` and everything from `@novice1/app`                                                   |
| `@novice1/frame/docs`    | `DocsShape`, schema/example/media-type/response shapes, and all of `@novice1/api-doc-generator` |
| `@novice1/frame/routing` | `controller`, `createWithSchema` and other helpers for routes validated with standard schemas |
| `@novice1/frame/security`| Security shapes (OAuth2, OpenID Connect) and helpers                                         |
| `@novice1/frame/errors`  | `HttpError` and `HTTP_ERRORS`                                                                |

## Quick start

```ts
import { Frame } from '@novice1/frame'

const app = new Frame()

app.get(
  {
    path: '/',
    name: 'Homepage',
    description: 'API homepage',
    tags: 'Index',
  },
  (_, res) => {
    return res.json({ message: 'Hello world!' })
  }
)

app.use((_, res) => {
  return res.status(404).json({ message: 'Not found' })
})

app.listen(3000)
```

## Framework configuration

The `framework` option extends the [@novice1/app](https://www.npmjs.com/package/@novice1/app) framework configuration:

- **auth**, **middlewares**, **validators**: see [@novice1/app](https://www.npmjs.com/package/@novice1/app).
- **validatorOnError**: `ErrorRequestHandler` used by the default validator when no validator was set.
- **cors**: `cors.CorsOptions | cors.CorsOptionsDelegate | boolean`. See [cors](https://www.npmjs.com/package/cors).
- **bodyParser**: `{ json?, urlencoded? }` options passed to `express.json()` and `express.urlencoded()`.
- **cookieParser**: `{ options?, secret? }`. See [cookie-parser](https://www.npmjs.com/package/cookie-parser).

```ts
import { Frame } from '@novice1/frame'

const app = new Frame({
  framework: {
    cors: true,
    bodyParser: { json: { limit: '1mb' } },
    cookieParser: { secret: 'my-secret' },
  },
})
```

## Routes with schema validation

`@novice1/frame/routing` offers an optional way of creating routes whose request data (`params`, `body`, `query`, `headers`, `cookies`, `files`) is validated by any library implementing [Standard Schema](https://standardschema.dev/), such as `zod`, `valibot` or `arktype`.

```ts
import { Frame } from '@novice1/frame'
import { createWithSchema } from '@novice1/frame/routing'
import { z } from 'zod/v4'

const router = createWithSchema()

router.with<{ id: string; message: string }>().post(
  {
    path: '/messages/:id',
    name: 'Update a message',
    tags: ['Messages'],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ message: z.string().min(1) }),
    },
  },
  async (req) => {
    // typed and validated data
    const { params, body } = req.validated()
    return { id: params.id, message: body.message }
  }
)

const app = new Frame({ routers: [router.getRouter()] })
```

- `createWithSchema(router?)` wraps an existing router (a new one by default). Use `.route({ method, ... })`, `.get()`, `.post()`, `.put()`, `.delete()`, `.patch()`, `.options()`, `.head()` or `.all()`.
- `.with<ResBody, Locals>()` types the response body and `res.locals` of the routes that follow.
- `req.validated()` returns the validated values. The validated `params`, `body`, ... are also assigned to the request (except `query`).
- On failure the response is a `400` with a `ValidationError` (`issues` holds the standard-schema issues). Override that per route with the `onerror` setting, or for all routes with `validatorOnError`.
- `options` is forwarded to the schema's `validate` function.
- `defineSchemaController(...)` lets you write a typed handler separately from the route:

```ts
import { defineSchemaController } from '@novice1/frame/routing'

const create = defineSchemaController<{ body: typeof bodySchema }, { id: string }>((req) => {
  const { body } = req.validated()
  return { id: body.name }
})
```

### Controllers

`controller()` wraps a handler so that what it returns is sent for you (and errors thrown from async handlers reach the error handlers):

- an object is sent as JSON,
- a string is sent as `text/plain`,
- a `Buffer` is sent as is,
- a readable stream is piped to the response,
- `undefined` does nothing (you handle the response yourself).

```ts
import { controller } from '@novice1/frame/routing'

app.get('/ping', controller(async () => ({ pong: true })))
```

### Errors

```ts
import { HttpError, HTTP_ERRORS } from '@novice1/frame/errors'

app.get('/secret', () => {
  throw new HttpError('Not allowed', 403)
})

app.useError((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message || err.errorMessage })
  }
  return res.status(500).send(HTTP_ERRORS[500])
})
```

## API documentation

The documentation of your API (OpenAPI and Postman) is generated from your routes. The schema endpoints are always available (unless docs are disabled), while the UIs must be **explicitly enabled**:

| Endpoint                   | Description                                       | Availability                   |
| -------------------------- | ------------------------------------------------- | ------------------------------ |
| `/docs`                    | Swagger UI                                        | `options.swagger.enabled`      |
| `/docs/redoc`              | Redoc                                             | `options.redoc.enabled`        |
| `/docs/schema`             | OpenAPI schema (YAML, or JSON with `?json=true`)  | always                         |
| `/docs/schema?format=postman` | Postman collection                             | always                         |

Swagger UI requires `swagger-ui-express` (see [Installation](#installation)). Redoc works out of the box.

```ts
import { Frame } from '@novice1/frame'

const app = new Frame({
  docs: {
    path: '/docs', // default
    title: 'My API',
    version: '1.0.0',
    license: { name: 'MIT', url: 'https://opensource.org/license/mit' },
    host: {
      url: 'http://{domain}:{port}',
      description: 'Dev API',
      variables: {
        domain: { default: 'localhost', enum: ['localhost', '127.0.0.1'] },
        port: { default: '3000' },
      },
    },
    tags: [{ name: 'Messages', description: 'Everything about messages' }],
    options: {
      logo: { url: 'https://path-to-image.png', alt: 'My API logo' },
      tagGroups: { Resources: ['Messages'] },
      redoc: { enabled: true },
      swagger: { enabled: true },
    },
  },
})
```

Other `docs` options: `disabled` (no docs routes at all), `consumes`, `security`, `examples`, `schemas` and `responses`.

Hide a route from the documentation with `parameters: { undoc: true }`.

### Generating the documentation from your validators

`docs.openAPIOptions` and `docs.postmanOptions` configure the generators from [@novice1/api-doc-generator](https://kisiwu.github.io/novice-api-doc-generator/latest/). Give them a helper class that converts your validator's schemas into documentation, for instance [@novice1/api-doc-zod-helper](https://www.npmjs.com/package/@novice1/api-doc-zod-helper) for `zod`.

When the routes are created with `createWithSchema`, `helperSchemaProperty` must be `'standardSchema'`:

```ts
import { OpenAPIZodHelper, PostmanZodHelper } from '@novice1/api-doc-zod-helper'
import { Frame } from '@novice1/frame'

const app = new Frame({
  docs: {
    openAPIOptions: {
      helperClass: OpenAPIZodHelper,
      helperSchemaProperty: 'standardSchema',
      version: '3.1.1',
    },
    postmanOptions: {
      helperClass: PostmanZodHelper,
      helperSchemaProperty: 'standardSchema',
    },
  },
})
```

### Using other documentation UIs

The schema is plain OpenAPI, so any UI can use it. For example with [Scalar](https://www.npmjs.com/package/@scalar/express-api-reference):

```ts
import routing from '@novice1/routing'
import { apiReference } from '@scalar/express-api-reference'

const scalarRouter = routing().use('/docs/scalar', apiReference({ url: '/docs/schema' }))

const app = new Frame({ routers: [scalarRouter] })
```

## Docs shapes

`@novice1/frame/docs` re-exports everything from `@novice1/api-doc-generator` and adds shapes that help you describe and reuse parts of the documentation:

- `DocsShape`: fluent alternative to the `docs` configuration object,
- `ExampleShape`, `SchemaShape`: reusable examples and schemas (referenced with `$ref`),
- `MediaTypeShape`: a media type that accepts `ExampleShape` and `SchemaShape`,
- `ResponseShape`, `ContextResponseShape`, `GroupResponseShape`: response definitions that can be reused across routes.

### DocsShape

```ts
import { Frame } from '@novice1/frame'
import { DocsShape } from '@novice1/frame/docs'

const docs = new DocsShape()
  .setTitle('My API')
  .setVersion('1.0.0')
  .setHost({ url: 'http://localhost:3000', description: 'Dev API' })
  .setLicense('MIT', 'https://opensource.org/license/mit')
  .setLogo('https://path-to-image.png', 'My API logo')
  .setRedocOptions({ enabled: true })
  .setSwaggerUIOptions({ enabled: true })

const app = new Frame({ docs })
```

### Response shapes

Response shapes define the structure of your API responses. Define them once, register them in the docs, then use them in routes.

```ts
import { Frame } from '@novice1/frame'
import {
  ContextResponseShape,
  DocsShape,
  ExampleShape,
  GroupResponseShape,
  MediaTypeShape,
  ResponseShape,
  SchemaShape,
} from '@novice1/frame/docs'

// reusable example and schemas
const helloExample = new ExampleShape('HelloExample')
  .setValue({ message: 'Hello world!' })
  .setDescription('The default output.')

const messageSchema = new SchemaShape('Message', {
  description: 'The message content.',
  type: 'string',
})

const messageResponseSchema = new SchemaShape('MessageResponse', {
  type: 'object',
  properties: { message: messageSchema },
  required: ['message'],
})

// reusable responses
const greetingsResponse = new ResponseShape('GreetingsResponse')
  .setDescription('Success')
  .addMediaType(
    'application/json',
    new MediaTypeShape({
      examples: { default_output: helloExample },
      schema: messageResponseSchema,
    })
  )

const badRequestResponse = new ResponseShape('BadRequest')
  .setDescription('Bad request')
  .addMediaType('application/json', { schema: { type: 'object', properties: { error: { type: 'string' } } } })

// frame
const app = new Frame({
  docs: new DocsShape()
    .setExamples([helloExample])
    .setSchemas([messageSchema, messageResponseSchema])
    .setResponses(new GroupResponseShape([greetingsResponse, badRequestResponse])),
})

// routes
app.get(
  {
    path: '/greetings',
    description: 'Greetings',
    tags: 'Tests',
    responses: new GroupResponseShape([
      new ContextResponseShape(greetingsResponse).setCode(200),
      new ContextResponseShape(badRequestResponse).setCode(400),
    ]),
  },
  (_, res) => res.json({ message: 'Hello world!' })
)
```

Responses, schemas and examples that are registered in the docs are referenced instead of repeated, which makes the generated schema shorter.

A route can also define a single response inline:

```ts
responses: new ResponseShape()
  .setDescription('Success')
  .addMediaType('application/json', { schema: { type: 'object' } })
  .setCode(200)
```

- `ResponseShape` represents a single response. It extends [`ResponseUtil`](https://kisiwu.github.io/novice-api-doc-generator/latest/classes/utils_responses_responseUtil.ResponseUtil.html).
- `MediaTypeShape` represents a media type within a response. It extends [`MediaTypeUtil`](https://kisiwu.github.io/novice-api-doc-generator/latest/classes/utils_responses_mediaTypeUtil.MediaTypeUtil.html).
- `GroupResponseShape` groups multiple responses together. It extends [`GroupResponseUtil`](https://kisiwu.github.io/novice-api-doc-generator/latest/classes/utils_responses_responseUtil.GroupResponseUtil.html).
- `ContextResponseShape` associates a response with a specific context (e.g., HTTP status code). It extends [`ContextResponseUtil`](https://kisiwu.github.io/novice-api-doc-generator/latest/classes/utils_responses_contextResponseUtils.ContextResponseUtil.html).

## Security

Security shapes (`@novice1/frame/security`) describe an authorization flow **and** wire it into the frame. A security shape:

- generates the security scheme of the documentation,
- provides the authorization middlewares (`authHandlers()`),
- optionally provides a router with the flow's endpoints (`router()`).

```ts
import { Frame } from '@novice1/frame'
import type { ISecurityShape } from '@novice1/frame/security'

const app = new Frame({ security: mySecurityShape })
```

Routes use the frame's `auth` by default only when they ask for it (`auth: true`).

### OAuth2 and OpenID Connect

The OAuth2 and OpenID Connect flows are supported through [@saurbit/oauth2](https://www.npmjs.com/package/@saurbit/oauth2), which you install separately. You build a flow with the flow builders from `@saurbit/oauth2`, then wrap it in a security shape:

| Security shape                        | Flow                                            |
| ------------------------------------- | ----------------------------------------------- |
| `AuthorizationCodeSecurityShape`      | OAuth2 authorization code (+ PKCE)              |
| `ClientCredentialsSecurityShape`      | OAuth2 client credentials                       |
| `OIDCAuthorizationCodeSecurityShape`  | OpenID Connect authorization code (+ PKCE)      |
| `OIDCClientCredentialsSecurityShape`  | OpenID Connect client credentials               |

Shape options:

- `flow`: the flow built with `@saurbit/oauth2`,
- `authHandler(flow, req, res, next)`: protects the routes that require authorization,
- `middleware(flow, req, res, next)` (optional): runs on every request, for example to turn a verified token into a session. Register it with `shape.middlewares()`,
- `host` (optional): origin used to build absolute URLs.

Example with the client credentials flow:

```ts
import { Frame } from '@novice1/frame'
import { HttpError } from '@novice1/frame/errors'
import {
  ClientCredentialsSecurityShape,
  createBodyParserOptions,
  toWebStandardRequest,
} from '@novice1/frame/security'
import { ClientCredentialsFlowBuilder } from '@saurbit/oauth2'

const flow = new ClientCredentialsFlowBuilder({
  securitySchemeName: 'clientCredentials',
  accessTokenLifetime: 900,
  description: 'Client credentials flow',
  scopes: { read: 'Read access', write: 'Write access' },
  tokenEndpoint: '/oauth2/token',
})
  .clientSecretBasicAuthenticationMethod()
  .getClient((tokenRequest) => {
    // look up the client, return undefined if not found
  })
  .generateAccessToken((grantContext) => {
    // create and store the token
    return 'the-token'
  })
  .verifyToken((request, { token }) => {
    // check the token
    return { isValid: false }
  })
  .build()

const securityShape = new ClientCredentialsSecurityShape({
  flow,
  authHandler: (_flow, req, res, next) => {
    if ('auth' in req && req.auth) return next()
    return res.status(401).send('Unauthorized')
  },
  middleware: async (flow, req, _res, next) => {
    const result = await flow.verifyToken(toWebStandardRequest(req))
    if (result.success) (req as { auth?: unknown }).auth = result.credentials
    return next()
  },
})

// Add the flow's endpoints BEFORE creating the Frame
securityShape.getOrCreateRouter().post(
  { path: securityShape.getTokenEndpoint(), parameters: { undoc: true } },
  async (req, res) => {
    const result = await securityShape.token(req)
    if (!result.success) {
      return res.status(result.error.statusCode ?? 400).json({
        error: result.error.errorCode,
        error_description: result.error.message,
      })
    }
    return res.status(200).json(result.tokenResponse)
  }
)

const app = new Frame({
  framework: {
    // keeps the raw body, needed by the flows to read token requests
    bodyParser: { ...createBodyParserOptions() },
    middlewares: [securityShape.middlewares()],
  },
  security: securityShape,
})
```

Protect a route and document the scopes it needs:

```ts
app.get(
  {
    path: '/messages',
    auth: true,
    parameters: { security: securityShape.toOpenAPISecurity(['read']) },
  },
  (req, res, next) => {
    // check if the user has the required scopes
    next()
  },
  (_, res) => res.json([])
)
```
> The `auth: true` property ensures that the route requires authentication, and the `parameters.security` array only documents the required scopes for the route. You have to implement the actual scope checks in your route handler.

Authorization code shapes also expose `getAuthorizationEndpoint()`, `initiateAuthorization(req)`, `processAuthorization(req, data)` and `handleAuthorizationEndpoint(req, data)`. OpenID Connect shapes add `getDiscoveryEndpoint()`, `getDiscoveryConfiguration(req)` and `getJwksEndpoint()`. You implement the endpoints (login form, redirects, discovery, JWKS) with these methods on `securityShape.getOrCreateRouter()`.

Helpers:

- `toWebStandardRequest(req, { origin? })`: converts an Express request to a Web `Request`,
- `createBodyParserOptions()`: body parser options that keep the raw body,
- `RequestHandlerWithFlow`, `AuthHandlerWithFlow`: handler types that receive the flow as first argument.

### Custom security shape

Implement `ISecurityShape` to use any other scheme:

```ts
import { Frame } from '@novice1/frame'
import { ApiKeyLocation, ApiKeyUtil, GroupAuthUtil } from '@novice1/frame/docs'
import type { ISecurityShape } from '@novice1/frame/security'
import routing from '@novice1/routing'

class MySecurityShape implements ISecurityShape {
  // optional: routes added to the frame (for example to generate keys)
  // router() { return routing() }

  // the documentation of the security scheme
  scheme() {
    return new GroupAuthUtil([
      new ApiKeyUtil('APIKey')
        .setApiKeyLocation(ApiKeyLocation.header)
        .setName('authorization')
        .setDescription("API key prefixed by 'Session '."),
    ])
  }

  // middlewares that give authorization
  authHandlers(): routing.RequestHandler[] {
    return [
      (req, res, next) => {
        if (!req.header('authorization')?.startsWith('Session ')) {
          return res.status(401).json({ error: 'unauthorized' })
        }
        // validate the key
        return next()
      },
    ]
  }
}

const app = new Frame({ security: new MySecurityShape() })
```

## References

- [@novice1/api-doc-generator](https://kisiwu.github.io/novice-api-doc-generator/latest/)
- [@novice1/app](https://kisiwu.github.io/novice-app/latest/)
- [@novice1/routing](https://www.npmjs.com/package/@novice1/routing#readme)
- [@saurbit/oauth2](https://www.npmjs.com/package/@saurbit/oauth2)
- [Standard Schema](https://standardschema.dev/)