import type { Request as NoviceRequest } from '@novice1/routing';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

export function toWebRequest(req: NoviceRequest): Request {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost';
  const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

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
