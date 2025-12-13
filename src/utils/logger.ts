// Production-safe console logging
// This utility replaces console.log with empty functions in production
// but keeps normal behavior in development

const isProduction = process.env.NODE_ENV === 'production';

// Create a safe console object that does nothing in production
const logger = {
  log: isProduction ? () => {} : console.log,
  warn: isProduction ? () => {} : console.warn,
  error: console.error, // Keep error logs even in production
  info: isProduction ? () => {} : console.info,
  debug: isProduction ? () => {} : console.debug,
};

export default logger;
