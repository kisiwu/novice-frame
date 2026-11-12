import { createWithSchema, withSchema } from './validator/routing';
import routing from '@novice1/routing';
import * as v from 'valibot';

export function testValidator() {
  // define the router
  const myRouter = routing();

  // define the body schema
  const bodySchema = v.object({
    artist: v.string(),
    title: v.string(),
    year: v.number(),
    genres: v.array(v.string()),
    songDurations: v.array(v.number()),
    outOfPublication: v.optional(v.boolean()),
  });

  // register the route with the schema
  withSchema(
    myRouter,
    'post',
    {
      //path: '/no-params',
      path: '/:file{.:ext}/*splat',
      //path: /\/example\//,
      parameters: {
        standardSchema: {
          body: bodySchema,
        },
      },
    },
    (req) => {
      const body = req.validated().body;
      const file = req.params.file;
      const ext = req.params.ext;
      const splat = req.params.splat;
      const artist = req.body.artist;
      const songDurations = req.body.songDurations;
      const outOfPublication = req.body.outOfPublication;
    },
    (req) => {
      const body = req.validated().body;
    }
  );

  const withSchemaFn = createWithSchema<{ ok: boolean }>(myRouter);

  withSchemaFn.route(
    'get',
    {
      path: '/example',
      schema: {
        query: v.object({
          id: v.string(),
        }),
      },
    },
    async (req) => {
      const query = req.validated().query;
      return { ok: !!query.id };
    }
  );
}
