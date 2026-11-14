import {
  addMessage,
  deleteMessageById,
  getMessageById,
  getMessages,
  getMessagesWithSensitiveData,
  updateMessageById,
} from './data';
import { ResponseShape, SchemaObject } from '@novice1/frame';
import { HttpError } from '@novice1/frame/errors';
import { createWithSchema } from '@novice1/frame/validator';
import routing from '@novice1/routing';
import { z } from 'zod/v4';

//#region Constants

/**
 * Schema for a single message in the response body.
 * This avoids including sensitive data in the response.
 */
const resBodyMessageSchema = z
  .object({
    id: z.string(),
    message: z.string(),
  })
  .strict();

/**
 * Schema for the list of messages in the response body.
 * This ensures that each message in the list conforms to the single message schema.
 */
const resBodyListSchema = z.array(resBodyMessageSchema);

const router = createWithSchema();

//#endregion Constants

//#region Post

router.with<{ message: string; id: string }>().post(
  {
    path: '/messages',
    name: 'Post a message',
    description: 'Posts a new message',
    tags: ['Messages'],
    parameters: {
      story: `### The Post Message Endpoint
This endpoint allows you to post a new message.

The request body must include a "message" field of type string.
      `,
    },
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

//#endregion Post

//#region List

router.with<z.infer<typeof resBodyListSchema>>().get(
  {
    path: '/messages',
    name: 'List messages',
    description: 'Retrieves all messages',
    tags: ['Messages'],
    schema: {
      query: z.object({
        search: z.string().min(2).optional(),
        force: z.preprocess(
          (x: unknown) => (typeof x === 'string' && x.toLocaleLowerCase() === 'true' ? true : false),
          z.boolean().meta({ description: 'Try to force getting sensitive data' }).optional()
        ),
      }),
    },
    responses: new ResponseShape()
      .setDescription('Get request successful')
      .addMediaType('application/json', {
        schema: resBodyListSchema.toJSONSchema() as SchemaObject,
      })
      .setCode(200),
  },
  async ({ method, originalUrl, validated }) => {
    const {
      query: { search, force },
    } = validated();
    const messages = force ? await getMessagesWithSensitiveData(search) : await getMessages(search);
    const ok = resBodyListSchema.validate(messages);
    if (ok) {
      return messages;
    }
    throw new HttpError(`Response body validation failed at ${method.toUpperCase()} ${originalUrl}`);
  }
);

//#endregion List

//#region Get

router
  .with<z.infer<typeof resBodyMessageSchema>>()
  .get(
    {
      path: '/messages/:id',
      name: 'Get a message',
      description: 'Retrieves a single message by ID',
      tags: ['Messages'],
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: new ResponseShape()
        .setDescription('Get request successful')
        .addMediaType('application/json', {
          schema: resBodyMessageSchema.toJSONSchema() as SchemaObject,
        })
        .setCode(200),
    },
    async ({ method, originalUrl, params: { id } }) => {
      const message = await getMessageById(id);
      if (message) {
        const ok = resBodyMessageSchema.validate(message);
        if (!ok) {
          throw new HttpError(`Response body validation failed at ${method.toUpperCase()} ${originalUrl}`);
        }
        return message;
      }
      throw new HttpError('Message not found', 404);
    }
  )
  .get(
    {
      path: '/messages/:id/comments',
      name: 'Get comments for a message',
      description: 'Retrieves all comments for a single message by ID',
      tags: ['Messages'],
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
    },
    () => {
      throw new HttpError('Not implemented', 501);
    }
  );

//#endregion Get

//#region Update

router.with<z.infer<typeof resBodyMessageSchema>>().put(
  {
    path: '/messages/:id',
    name: 'Update a message',
    description: 'Updates a single message by ID',
    tags: ['Messages'],
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        message: z.string().min(1),
      }),
    },
    responses: new ResponseShape()
      .setDescription('Update request successful')
      .addMediaType('application/json', {
        schema: resBodyMessageSchema.toJSONSchema() as SchemaObject,
      })
      .setCode(200),
  },
  async ({ params: { id }, validated }) => {
    const {
      body: { message },
    } = validated();
    const updated = await updateMessageById(id, message);
    if (updated) {
      return { id, message };
    }
    throw new HttpError('Message not found', 404);
  }
);

//#endregion Update

//#region Delete

router.delete(
  {
    path: '/messages/:id',
    name: 'Delete a message',
    description: 'Deletes a single message by ID',
    tags: ['Messages'],
    schema: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: new ResponseShape().setDescription('Delete request successful').setCode(200),
  },
  async ({ params: { id } }) => {
    const deleted = await deleteMessageById(id);
    if (deleted) {
      return { id };
    }
    throw new HttpError('Message not found', 404);
  }
);

//#endregion Delete

export default routing().use('/api', router.getRouter());
