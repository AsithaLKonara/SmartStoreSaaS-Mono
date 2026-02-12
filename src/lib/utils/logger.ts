import { logger } from '@/lib/logger';

const wrap = (message: string, meta?: any) => {
    const { error, correlation, ...rest } = meta || {};
    return {
        message,
        error,
        correlation,
        context: Object.keys(rest).length > 0 ? rest : undefined
    };
};

export const iotLogger = {
    info: (message: string, meta?: any) => logger.info(wrap(message, meta)),
    warn: (message: string, meta?: any) => logger.warn(wrap(message, meta)),
    error: (message: string, meta?: any) => logger.error(wrap(message, meta)),
    debug: (message: string, meta?: any) => logger.debug(wrap(message, meta)),
};

export const smsLogger = {
    info: (message: string, meta?: any) => logger.info(wrap(message, meta)),
    warn: (message: string, meta?: any) => logger.warn(wrap(message, meta)),
    error: (message: string, meta?: any) => logger.error(wrap(message, meta)),
    debug: (message: string, meta?: any) => logger.debug(wrap(message, meta)),
};
