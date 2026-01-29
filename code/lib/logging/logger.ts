type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

const formatPayload = (level: LogLevel, payload: LogPayload) => {
  const base = {
    level,
    message: payload.message,
    timestamp: new Date().toISOString(),
    ...(payload.context ? { context: payload.context } : {}),
  };
  if (payload.error) {
    return { ...base, error: payload.error };
  }
  return base;
};

export const logger = {
  info: (payload: LogPayload) => {
    console.log(formatPayload('info', payload));
  },
  warn: (payload: LogPayload) => {
    console.warn(formatPayload('warn', payload));
  },
  error: (payload: LogPayload) => {
    console.error(formatPayload('error', payload));
  },
};
