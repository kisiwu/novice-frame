import router from './router';
import { OpenAPIZodHelper, PostmanZodHelper } from '@novice1/api-doc-zod-helper';
import { Frame } from '@novice1/frame';
import { HttpError, HTTP_ERRORS } from '@novice1/frame/errors';
import { AddressInfo } from 'node:net';

const app = new Frame({
  routers: [router],
  docs: {
    path: '/docs',
    openAPIOptions: {
      helperClass: OpenAPIZodHelper,
      helperSchemaProperty: 'standardSchema',
      version: '3.1.1',
    },
    postmanOptions: {
      helperClass: PostmanZodHelper,
      helperSchemaProperty: 'standardSchema',
    },
    options: {
      swagger: {
        customJs: ['/docs/_resources/swagger-custom.js'],
      },
    },
  },
});

app.get({ path: '/docs/_resources/swagger-custom.js', parameters: { undoc: true } }, (_, res) => {
  return res.header('Content-Type', 'application/javascript').send(`
      setTimeout(() => {
        if (document.documentElement.classList.contains("dark-mode")) { document.documentElement.classList.remove("dark-mode"); }
      }, 10);
    `);
});

app.get(
  {
    path: '/',
    name: 'Homepage',
    description: 'API homepage',
    tags: 'Index',
  },
  (_, res) => {
    return res.header('Content-Type', 'text/html').send(`
      <html>
        <head>
          <title>API Homepage</title>
        </head>
        <body>
          <a href="/docs" target="_blank">Swagger UI ↗</a>
          <br />
          <br />
          <a href="/docs/redoc" target="_blank">Redoc ↗</a>
          <br />
          <br />
          <a href="/docs/schema" target="_blank">OpenAPI Schema 3.1.1 ↗</a>
          <br />
          <br />
          <a href="/docs/schema?format=postman" target="_blank">Postman Collection 2.1.0 ↗</a>
        </body>
      </html>
    `);
  }
);

app.use((_, res) => {
  return res.status(404).send(HTTP_ERRORS[404]);
});

app.useError((err, _, res, _next) => {
  if (err instanceof HttpError) {
    if (err.statusCode >= 500) {
      console.error(err);
      return res.status(err.statusCode).send(err.errorMessage);
    }
    return res.status(err.statusCode).json({ message: err.message || err.errorMessage });
  }
  console.error(err);
  return res.status(500).send(HTTP_ERRORS[500]);
});

const server = app.listen(3000);
console.log(`Server is running on http://localhost:${(server.address() as AddressInfo).port}`);
