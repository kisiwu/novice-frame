import routing, { RequestHandler } from '@novice1/routing';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import { OpenAPI, Postman } from '@novice1/api-doc-generator';
import { DocsOptions } from '../docs';

export function createDocsRouter(path: string, { openapi, postman }: { openapi: OpenAPI, postman: Postman }, options?: DocsOptions) {
    const swaggerUIController: RequestHandler = (req, res, next) => {
        const swaggerDocument = openapi.result()
        return swaggerUi.setup(swaggerDocument)(req, res, next)
    }

    const redocController: RequestHandler = (_, res) => {
        return res.send(`
   <!DOCTYPE html>
    <html>
      <head>
        <title>${openapi.getTitle()}</title>
        <!-- needed for adaptive design -->
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    
        <!--
        Redoc doesn't change outer page styles
        -->
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <redoc spec-url='${path}/schema?json=true'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
      </body>
    </html>
   `)
    }

    const swaggerRouter = routing()
        .get({
            path: '/',
            parameters: {
                undoc: true
            },
        },
            swaggerUIController)
        .get({
            path: '/redoc',
            parameters: {
                undoc: true
            },
        },
            redocController)
        .get({
            path: '/schema',
            parameters: {
                undoc: true
            }
        }, (req, res) => {
            const format = req.query.format == 'postman' ? postman : openapi;

            if (!format) return res.status(400).json('Unknown format');

            const r = format.result();

            if (options && req.query.format != 'postman') {
                // add logo 
                if (options.logo?.url) {
                    r.info['x-logo'] = {
                        url: options.logo.url,
                        altText: options.logo.alt
                    }
                }
                // add tag groups 
                if (options.tagGroups) {
                    const tagGroups: {name: string, tags: string[]}[] = []
                    for (const name in options.tagGroups) {
                        tagGroups.push({
                            name,
                            tags: options.tagGroups[name]
                        })
                    }
                    r['x-tagGroups'] = tagGroups
                }
            }

            if (!req.query.json && req.query.format != 'postman') {
                res.set('Content-Type', 'text/plain');
                return res.send(YAML.stringify(r, 10, 2));
            } else {
                return res.json(r);
            }
        });

    return routing().use(path,
        swaggerUi.serve,
        swaggerRouter
    );
}
