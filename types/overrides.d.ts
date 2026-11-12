import type * as routing from '@novice1/routing';
import type { StandardSchemaV1 } from '@standard-schema/spec';

declare global {
  namespace NoviceRouting {
    interface MetaParameters {
      onerror?: routing.ErrorRequestHandler | undefined;
      standardValidatorOptions?: StandardSchemaV1.Options | undefined;
    }
  }
}

export {};
