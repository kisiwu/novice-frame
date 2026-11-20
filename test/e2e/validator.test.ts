import { Frame } from '@novice1/frame';
import { createWithSchema } from '@novice1/frame/routing';
import routing from '@novice1/routing';
import { type } from 'arktype';
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import * as v from 'valibot';

describe('Validator Tests', () => {
  let app: Frame;

  beforeEach(() => {
    app = new Frame();
  });

  it('should validate the request body against the valibot schema', async () => {
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
        const responseBody = { ok: !!params.id, id: params.id, result: req.validated().body };
        return responseBody;
      }
    );

    app.use(router.getRouter());

    //console.log('meta:', myRouter.stack[0].route?.meta);
    //console.log('stack length:', myRouter.stack[0].route?.stack.length);
    //console.log('validator:', myRouter.stack[0].route?.stack[1]);

    app.useError((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });

    app.build();

    const res = await request(app._app)
      .put('/example/321')
      .send({
        artist: 'Artist Name',
        title: 'Song Title',
        year: 2023,
        genres: ['Pop'],
        songDurations: [180],
      })
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.id, '321');
    assert.deepStrictEqual(res.body.result, {
      artist: 'Artist Name',
      title: 'Song Title',
      year: 2023,
      genres: ['Pop'],
      songDurations: [180],
    });
  });

  it('should validate the request body against the arktype schema', async () => {
    // define the router
    const myRouter = routing();
    // define the body schema
    const bodySchema = type({
      artist: 'string',
      title: 'string',
      year: 'number',
      genres: 'string[]',
      songDurations: 'number[]',
      outOfPublication: 'boolean?',
    });

    // Exclude<ReturnType<typeof bodySchema>, type.errors>
    // == typeof bodySchema.infer

    // create a router with schema validation
    const router = createWithSchema(myRouter);
    router.with<{ ok: boolean; result?: typeof bodySchema.infer }>().route(
      {
        path: '/example/:id',
        method: 'put',
        schema: {
          params: type({
            id: 'string',
          }),
          body: bodySchema,
        },
        onerror: (err, req, res, next) => {
          console.error('onerror', err);
          res.status(400).json({ error: err.message });
        },
      },
      (req, res) => {
        const params = req.validated().params;
        const responseBody = { ok: !!params.id, id: params.id, result: req.validated().body };
        return responseBody;
      }
    );

    app.use(router.getRouter());

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
        year: 2026,
        genres: ['Pop'],
        songDurations: [210, 128],
      })
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.id, '123');
    assert.deepStrictEqual(res.body.result, {
      artist: 'Artist Name',
      title: 'Song Title',
      year: 2026,
      genres: ['Pop'],
      songDurations: [210, 128],
    });
  });
});
