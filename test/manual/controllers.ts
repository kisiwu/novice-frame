import {
  type SchemaController,
  type ValidatedData,
  type StandardValidatorSchema,
  createWithSchema,
} from '@novice1/frame/validator';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type * as core from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod/v4';

type SchemaControllerFor<
  Refs extends StandardValidatorSchema = StandardValidatorSchema,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = SchemaController<
  Refs extends { params: StandardSchemaV1 } ? StandardSchemaV1.InferOutput<Refs['params']> : core.ParamsDictionary,
  ResBody,
  Refs extends { body: StandardSchemaV1 } ? StandardSchemaV1.InferOutput<Refs['body']> : unknown,
  ParsedQs,
  Locals,
  MetaResType,
  ValidatedData<Refs>
>;

function defineSchemaController<
  Refs extends StandardValidatorSchema = StandardValidatorSchema,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(v: SchemaControllerFor<Refs, ResBody, Locals, MetaResType>) {
  return v;
}

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
