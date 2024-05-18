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
    tags: 'Test',
    name: 'Homepage',
    description: 'API Index',
}, (_, res) => {
    return res.json({ message: 'Hello world!' })
})

app.use((_, res) => {
    return res.status(404).json({ message: 'Not found' });
})

app.listen(3000)
```

### Framework configuration

Based on [@novice1/app](https://www.npmjs.com/package/@novice1/app). The default validator is [@novice1/validator-joi](https://www.npmjs.com/package/@novice1/validator-joi) if none was specified.

You can configure:

- `auth`: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app))
- `middlewares`: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app))
- `validators`: (See [@novice1/app](https://www.npmjs.com/package/@novice1/app). The default validator is [@novice1/validator-joi](https://www.npmjs.com/package/@novice1/validator-joi) if none was specified.)
- `validatorOnError`: `ErrorRequestHandler`. Only used for the default validator.
- `cors`: `cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | boolean`. (See [cors](https://www.npmjs.com/package/cors))
- `bodyParser`: `{ json?: bodyParser.OptionsJson, urlencoded?: bodyParser.OptionsUrlencoded }`. (See [body-parser](https://www.npmjs.com/package/body-parser))
- `cookieParser`: `{ options?: cookieParser.CookieParseOptions, secret?: string | string[] }`. (See [cookie-parser](https://www.npmjs.com/package/cookie-parser))

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

### Docs shape