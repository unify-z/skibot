import { pino } from 'pino';

export const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:standard',
      singleLine: true,
    },
  },
});
export default logger;
