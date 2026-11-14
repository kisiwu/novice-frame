import {
  type SchemaController,
  createWithSchema,
  type SchemaControllerFor,
  defineSchemaController,
} from '@novice1/frame/validator';
import { z } from 'zod/v4';

const postSchemaController: SchemaController<
  unknown,
  { message: string; id: string },
  { message: string },
  {},
  Record<string, unknown>,
  unknown,
  { body: { message: string } }
> = (req) => {
  const {
    body: { message },
  } = req.validated();
  return { message, id: 'test' };
};

const postSchema = z.object({
  message: z.string(),
});

const postController: SchemaControllerFor<{ body: typeof postSchema }, { message: string; id: string }> = (req) => {
  const params = req.params;
  const body = req.body;
  const query = req.query;
  const {
    body: { message },
  } = req.validated();
  return { message, id: 'test' };
};

const postController2 = defineSchemaController(postController);

const postController3 = defineSchemaController<{ body: typeof postSchema }, { message: string; id: string }>((req) => {
  const params = req.params;
  const body = req.body;
  const query = req.query;
  const {
    body: { message },
  } = req.validated();
  return { message, id: 'test' };
});

const router = createWithSchema();
router.with<{ message: string; id: string }>().post(
  {
    path: '/post',
    schema: {
      body: postSchema,
    },
  },
  postController3
);
