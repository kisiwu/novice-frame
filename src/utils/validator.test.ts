import { withSchema } from './validator/routing';
import routing from '@novice1/routing';
import * as v from 'valibot';

export function testValidator() {
  const bodySchema = v.object({
    artist: v.string(),
    title: v.string(),
    year: v.number(),
    genres: v.array(v.string()),
    songDurations: v.array(v.number()),
    outOfPublication: v.optional(v.boolean()),
  });
  withSchema(
    routing(),
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
    }
  );
}
