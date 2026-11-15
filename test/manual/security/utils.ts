import type { Request as NoviceRequest } from '@novice1/routing';
import type { OptionsJson, OptionsUrlencoded } from 'body-parser';
import type { Request as ExpressRequest } from 'express';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

/**
 * Creates options for body parsers that save the raw request body on the request object.
 * This is useful for scenarios where the raw body is needed for verification or processing.
 *
 * @returns An object containing `json` and `urlencoded` options for body parsers
 */
export function createBodyParserOptions(): { json: OptionsJson; urlencoded: OptionsUrlencoded } {
  return {
    json: {
      verify: (req, _, buf) => {
        if (buf && buf.length) {
          // Save the raw Buffer on the request object for later use
          (req as { _rawBody?: Buffer })._rawBody = buf;
        }
      },
    },
    urlencoded: {
      extended: true,
      verify: (req, _, buf) => {
        if (buf && buf.length) {
          // Save the raw Buffer on the request object for later use
          (req as { _rawBody?: Buffer })._rawBody = buf;
        }
      },
    },
  };
}

export interface WebStandardRequestOptions {
  /** Override the origin used to build the absolute URL. Defaults to the request's own origin. */
  origin?: string;
}

export type AnyExpressRequest = NoviceRequest | ExpressRequest;

/**
 * Converts an Express or Novice request into a standard Web Request object.
 *
 * @param req The incoming Express or Novice request
 * @returns A standard Web Request object representing the incoming request
 */
export function toWebStandardRequest(req: AnyExpressRequest, options?: WebStandardRequestOptions): Request {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost';
  const origin = options?.origin || `${protocol}://${host}`;
  const url = new URL(req.originalUrl || req.url, origin);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let body: BodyInit | null = null;
  const rawBody = (req as { _rawBody?: Buffer })._rawBody;

  if (hasBody) {
    if (rawBody) {
      body = Readable.toWeb(Readable.from(rawBody ?? Buffer.alloc(0))) as ReadableStream;
    } else if (req.readableEnded && req.body !== undefined) {
      const contentType = req.get('content-type') || '';
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Re-encode back to URLSearchParams so OAuth2 form parsing works
        body = new URLSearchParams(req.body as Record<string, string>);
      } else {
        body = JSON.stringify(req.body);
      }
    } else {
      body = Readable.toWeb(req) as ReadableStream;
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body,
    ...(hasBody && body instanceof ReadableStream ? { duplex: 'half' } : {}),
  });
}
