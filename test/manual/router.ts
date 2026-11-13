import { addMessage, getMessages } from './data';
import { ResponseShape, SchemaObject } from '@novice1/frame';
import { createWithSchema } from '@novice1/frame/validator';
import routing from '@novice1/routing';
import { z } from 'zod/v4';

const router = createWithSchema(routing());

routing();

router.with<{ message: string; id: string }>().route(
  'post',
  {
    path: '/messages',
    name: 'Post a message',
    description: 'Posts a new message',
    tags: ['Messages'],
    schema: {
      body: z.object({
        message: z.string(),
      }),
    },
    responses: new ResponseShape()
      .setDescription('Post request successful')
      .addMediaType('application/json', {
        schema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
          additionalProperties: false,
        },
      })
      .setCode(200),
  },
  async (req) => {
    const {
      body: { message },
    } = req.validated();
    const value = await addMessage(message);
    return value;
  }
);

/**
 * Avoid sensitive data in the response body
 */
const resBodyListSchema = z.array(
  z
    .object({
      id: z.string(),
      message: z.string(),
    })
    .strict()
);

router.with<{ id: string; message: string }[]>().route(
  'get',
  {
    path: '/messages',
    name: 'Get messages',
    description: 'Retrieves all messages',
    tags: ['Messages'],
    schema: {
      query: z.object({
        search: z.string().min(2).optional(),
      }),
    },
    responses: new ResponseShape()
      .setDescription('Get request successful')
      .addMediaType('application/json', {
        schema: resBodyListSchema.toJSONSchema() as SchemaObject,
      })
      .setCode(200),
  },
  async (req) => {
    const {
      query: { search },
    } = req.validated();
    const messages = await getMessages();
    const ok = resBodyListSchema.validate(messages);
    if (ok) {
      return search ? messages.filter((m) => m.message.includes(search)) : messages;
    }
    throw new Error('Response body validation failed');
  }
);

export default router.getRouter();
