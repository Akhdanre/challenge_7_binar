const Sentry = require('@sentry/node');
const { SENTRY_DSN, ENVIRONTMENT } = process.env

Sentry.init({
    environment: ENVIRONTMENT,
    dsn: SENTRY_DSN,
    integrations: [],
    tracesSampleRate: 1.0,
});

module.exports = Sentry