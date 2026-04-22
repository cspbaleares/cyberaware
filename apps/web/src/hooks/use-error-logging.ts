"use client";

import { useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

interface LogErrorOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}

export function useErrorLogging() {
  const logError = useCallback(
    (error: Error | string, options: LogErrorOptions = {}) => {
      const { tags = {}, extra = {}, level = "error" } = options;

      if (typeof error === "string") {
        Sentry.captureMessage(error, {
          level,
          tags,
          extra,
        });
      } else {
        Sentry.captureException(error, {
          level,
          tags: {
            ...tags,
            errorName: error.name,
          },
          extra: {
            ...extra,
            errorMessage: error.message,
            errorStack: error.stack,
          },
        });
      }
    },
    []
  );

  const logMessage = useCallback(
    (message: string, level: Sentry.SeverityLevel = "info", extra?: Record<string, any>) => {
      Sentry.captureMessage(message, {
        level,
        extra,
      });
    },
    []
  );

  const setUser = useCallback(
    (user: { id: string; email?: string; username?: string } | null) => {
      if (user) {
        Sentry.setUser(user);
      } else {
        Sentry.setUser(null);
      }
    },
    []
  );

  const addBreadcrumb = useCallback(
    (message: string, category?: string, level?: Sentry.SeverityLevel) => {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
      });
    },
    []
  );

  return {
    logError,
    logMessage,
    setUser,
    addBreadcrumb,
  };
}
