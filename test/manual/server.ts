import router from './router';
import { OpenAPIZodHelper, PostmanZodHelper } from '@novice1/api-doc-zod-helper';
import { Frame } from '@novice1/frame';
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
  return res.status(404).json({ message: 'Not found' });
});

const server = app.listen(3000);
console.log(`Server is running on http://localhost:${(server.address() as AddressInfo).port}`);
