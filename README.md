# @novice1/frame
Web framework for building APIs.

## Installation

```bash
npm i @novice1/frame
```

Other dependencies:
```bash
npm i @novice1/routing @novice1/api-doc-generator
```

Dependencies for typescript:
```bash
npm i -D @types/express @types/node
```

## Usage

### Simple usage

```ts
import { Frame } from '@novice1/frame'

const app = new Frame();

app.get({
    path: '/',
    name: 'Homepage',
    description: 'API homepage',
    tags: 'Index'
}, (_, res) => {
    return res.json({ message: 'Hello world!' })
})

app.use((_, res) => {
    return res.status(404).json({ message: 'Not found' });
})

app.listen(3000)
```

### Framework configuration

Based on [@novice1/app](https://www.npmjs.com/package/@novice1/app).

You can configure:

- __auth__: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app))
- __middlewares__: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app))
- __validators__: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app). The default validator is [@novice1/validator-joi](https://www.npmjs.com/package/@novice1/validator-joi) if none was specified.)
- __validatorOnError__: `ErrorRequestHandler`. Only used for the default validator.
- __cors__: `cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | boolean`. (See [cors](https://www.npmjs.com/package/cors))
- __bodyParser__: `{ json?: bodyParser.OptionsJson, urlencoded?: bodyParser.OptionsUrlencoded }`. (See [body-parser](https://www.npmjs.com/package/body-parser))
- __cookieParser__: `{ options?: cookieParser.CookieParseOptions, secret?: string | string[] }`. (See [cookie-parser](https://www.npmjs.com/package/cookie-parser))

```ts
import { Frame } from '@novice1/frame'

const app = new Frame({
    framework: {
        cors: true,
        validatorOnError: (err, _req, res) => {
            // avoid sending back sensitive data ('_original' from joi validator)
            const {_original, ...details} = err
            return res.status(400).json({...details, code: 'badRequest'})
        }
    }
});
```

### API documentation

By default, the documentation of your API gets generated and accessible at:
- `/docs`,
- `/docs/redoc`,
- `/docs/schema`,
- `/docs/schema?format=postman`.

You can add more info to the documentation and change the `/docs` prefix to somthing else if you want.

TODO: LINK TO REFERENCE

```ts
import { Frame } from '@novice1/frame'

const app = new Frame({
    docs: {
        host: {
            url: 'http://{domain}:{port}',
            description: 'Dev API',
            variables: {
                domain: {
                    default: 'localhost',
                    enum: [
                        'localhost',
                        '127.0.0.1'
                    ],
                    description: 'Dev domain'
                },
                port: {
                    default: '3000'
                }
            }
        },
        title: '@novice1/frame API',
        license: {
            name: 'ISC',
            url: 'https://opensource.org/license/isc-license-txt'
        },
        options: {
            logo: {
                url: 'https://path-to-image.png',
                alt: 'Dev API logo'
            }
        }
    }
});
```

## Shapes

You can shape your frame (`@novice1/frame`) to easily give authenticity to your API.

Shapes can help to generate your API documentation and API authorization (oAuth2, ...).

### Security shape

The security shapes implement the interface `ISecurityShape`. `@novice1/frame` offers the following security shapes:
- `OAuth2ACShape`: OAuth2 authorization code grant flow (+ PKCE)
- `OAuth2ClientCredsShape`: OAuth2 client credentials grant flow
- `OAuth2PasswordShape`: OAuth2 password grant flow


Example of using OAuth2 password grant flow:
```ts
import { 
    Frame,
    OAuth2PasswordShape, 
    OAuth2PasswordTokenRoute, 
    OAuth2TokenResponse 
} from '@novice1/frame'

const tokenRoute = new OAuth2PasswordTokenRoute('/oauth2/v1/token')
  .setHandler((params, _req, res) => {
    let token: string;
    let refreshToken: string;

    // Here you handle the access token request
    // ...

    return res.json(
        new OAuth2TokenResponse(token, 'bearer')
          .setExpiresIn(3600)
          .setRefreshToken(refreshToken)
          .setScope(params.scope)
      )
  })

const securityShape = new OAuth2PasswordShape('oAuth2', tokenRoute)
    .setDescription('This API uses OAuth 2 with the password grant flow. [More info](/docs/redoc)')
    .clientAuthenticationToBody()
    .setAuthHandlers(
        (req, res, next) => {
            const authHeaderValue = req.header('authorization')
            if (authHeaderValue && authHeaderValue.startsWith('Bearer ')) {
                const token = authHeaderValue.substring(7)

                // Here you validate the token
                // ...

                // authorized to go further
                return next()
            }

            return res.status(401).json({
                error: 'unauthorized'
            })
        }
    )

const app = new Frame({
    security: securityShape
});
```

Security shapes will register the authorization documentation, route(s) and middleware(s) to your API. 

That way, you just have to go to `/docs` to try the authorization flow of your API. Easy, right?

You could even make your own security shape:
```ts
import { 
    Frame,
    ApiKeyLocation, 
    ApiKeyUtil, 
    GroupAuthUtil, 
    ISecurityShape 
} from '@novice1/frame'
import routing from '@novice1/routing'

class MySecurityShape implements ISecurityShape {
    /**
     * Optional: define the routes that generate the API key
     */
    //router(): routing.IRouter {
    //    return routing()
    //}

    /**
     * @returns a BaseAuthUtil extension ([@novice1/api-doc-generator](https://kisiwu.github.io/novice-api-doc-generator/latest/classes/utils_auth_basicAuthUtil.BasicAuthUtil.html))
     */
    scheme(): GroupAuthUtil {
        const apiKey = new ApiKeyUtil('APIKey')
            .setApiKeyLocation(ApiKeyLocation.header) // the location of the key (cookie, header or query)
            .setName('authorization') // the header's name
            .setDescription('Generated API key from your application console. MUST be prefixed by \'Session \'.')

        return new GroupAuthUtil([
            apiKey
        ])
    }

    /**
     * @returns Middlewares that give authorization
     */
    authHandlers(): routing.RequestHandler[] {
        return [
            (req, res, next) => {
                const value = req.header('authorization')

                if (value?.startsWith('Session ')) {
                    return res.status(401).json({ error: 'unauthorized' })
                }

                // Here you validate the api key
                // ...

                // authorized to go further
                return next()
            }
        ]
    }
}

const app = new Frame({
    security: new MySecurityShape()
});
```

Using a security shape is the recommended way to register an authorization flow to the frame. Of course, other ways are possible but that would be using [@novice1/app](https://www.npmjs.com/package/@novice1/app) and [@novice1/api-doc-generator](https://www.npmjs.com/package/@novice1/api-doc-generator) without the advantages of the `Frame`.

### Docs shape

We saw [previously](#api-documentation) that you could configure the documentation.
Tools, including the class `DocsShape`, can help you with that.

The current list of those tools is:
- `DocsShape` (of course)
- `ExampleShape`
- `MediaTypeShape`
- `SchemaShape`
- `ContextResponseShape`
- `GroupResponseShape`
- `ResponseShape`

If you are familiar with [@novice1/api-doc-generator](https://www.npmjs.com/package/@novice1/api-doc-generator) (which is not possible for any human being, lol), you will understand their purpose faster than anyone else.

TODO: to continue

## References

- [@novice1/api-doc-generator](https://kisiwu.github.io/novice-api-doc-generator/latest/)
- [@novice1/app](https://kisiwu.github.io/novice-app/latest/)
- [@novice1/routing](https://www.npmjs.com/package/@novice1/routing#readme)
- [@novice1/validator-joi](https://kisiwu.github.io/novice-validator-joi/latest/)