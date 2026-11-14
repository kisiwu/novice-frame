import { Frame } from '@novice1/frame';
import { createWithSchema } from '@novice1/frame/validator';
import routing from '@novice1/routing';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import * as v from 'valibot';

describe('Validator Tests', () => {
  let app: Frame;

  beforeEach(() => {
    app = new Frame();
  });

  it('should validate the request body against the schema', async () => {
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
    // create a router with schema validation
    const router = createWithSchema(myRouter);
    router.with<{ ok: boolean; result?: v.InferInput<typeof bodySchema> }>().route(
      {
        path: '/example/:id',
        method: 'put',
        schema: {
          params: v.object({
            id: v.string(),
          }),
          body: bodySchema,
        },
        onerror: (err, req, res, next) => {
          console.error('onerror', err);
          res.status(400).json({ error: err.message });
        },
      },
      async (req, res) => {
        const params = req.validated().params;
        const responseBody = { ok: !!params.id, result: req.validated().body };
        return responseBody;
      }
    );

    app.use(router.getRouter());

    /*
    console.log('meta:', myRouter.stack[0].route?.meta);
    console.log('stack length:', myRouter.stack[0].route?.stack.length);
    console.log('validator:', myRouter.stack[0].route?.stack[1]);
    */

    app.useError((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });

    app.build();

    const res = await request(app._app)
      .put('/example/123')
      .send({
        artist: 'Artist Name',
        title: 'Song Title',
        year: 2023,
        genres: ['Pop'],
        songDurations: [180],
      })
      .set('Accept', 'application/json')
      .expect(200);

    console.log('response:', res.body);
  });
});
