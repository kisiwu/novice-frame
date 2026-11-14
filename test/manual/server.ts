import router from './router';
import { OpenAPIZodHelper, PostmanZodHelper } from '@novice1/api-doc-zod-helper';
import { Frame } from '@novice1/frame';
import { HttpError, HTTP_ERRORS } from '@novice1/frame/errors';
import { AddressInfo } from 'node:net';

const app = new Frame({
  routers: [router],
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
});

app.get(
  {
    path: '/',
    name: 'Homepage',
    description: 'API homepage',
    tags: 'Index',
  },
  (_, res) => {
    return res.json({ message: 'Hello world!' });
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
