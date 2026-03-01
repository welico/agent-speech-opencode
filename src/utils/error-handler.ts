import type { Logger } from './logger.js';

export class DebugError extends Error {
  code: string;
  details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'DebugError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  logger?: Logger
): Promise<T> {
  try {
    logger?.debug(`Starting: ${operation}`);
    const result = await fn();
    logger?.debug(`Completed: ${operation}`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger?.error(`Failed: ${operation}`, { message, stack });

    throw new DebugError(
      'OPERATION_FAILED',
      `${operation} failed: ${message}`,
      { originalError: message, stack }
    );
  }
}

export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  logger?: Logger
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error('Safe execution failed, using fallback', { message });
    return fallback;
  }
}
