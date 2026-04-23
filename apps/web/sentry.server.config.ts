// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://76470ae7d807732b0bcc2bc047222d23@o4511264731758592.ingest.de.sentry.io/4511264733069392",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture uncaught exceptions
  onFatalError(error) {
    console.error("Fatal error captured by Sentry:", error);
  },
});
