import { SchemaController, ValidatedData, StandardValidatorSchema, createWithSchema } from '@novice1/frame/validator';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type * as core from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod/v4';

export type ReqRefDefaults = {
  params?: core.ParamsDictionary;
  body?: unknown;
  query?: Record<string, string | string[]>;
  headers?: unknown;
  files?: unknown;
  cookies?: unknown;
};

type IsEmpty<T> = [T] extends [never]
  ? true
  : [T] extends [undefined]
    ? true
    : [unknown] extends [T]
      ? true // catches unknown and any
      : false;

export type ReqRef = Partial<Record<keyof ReqRefDefaults, unknown>>;

export type MyController<
  Refs extends StandardValidatorSchema = StandardValidatorSchema,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
> = SchemaController<
  IsEmpty<Refs['params']> extends true
    ? core.ParamsDictionary
    : StandardSchemaV1.InferOutput<NonNullable<Refs['params']>>,
  ResBody,
  IsEmpty<Refs['body']> extends true ? unknown : StandardSchemaV1.InferOutput<NonNullable<Refs['body']>>,
  ParsedQs,
  Locals,
  MetaResType,
  ValidatedData<Refs>
>;

function createMyController<
  Refs extends StandardValidatorSchema = StandardValidatorSchema,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  MetaResType = unknown,
>(v: MyController<Refs, ResBody, Locals, MetaResType>) {
  return v;
}

const postSchema = z.object({
  message: z.string(),
});

const postController: MyController<{ body: typeof postSchema }, { message: string; id: string }> = (req) => {
  const params = req.params;
  const body = req.body;
  const query = req.query;
  const {
    body: { message },
  } = req.validated();
  return { message, id: 'test' };
};

const postController2 = createMyController(postController);

const router = createWithSchema();
router.with<{ message: string; id: string }>().post(
  {
    path: '/post',
    schema: {
      body: postSchema,
    },
  },
  postController2
);
/*
export const postController: SchemaController<
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
*/
