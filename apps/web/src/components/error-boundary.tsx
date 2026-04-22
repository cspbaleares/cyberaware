"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        component: "ErrorBoundary",
      },
      extra: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorDigest: error.digest,
      },
    });
  }, [error]);

  const handleReportError = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: "Reportar error",
      subtitle: "Nuestro equipo ha sido notificado. ¿Puedes ayudarnos con más detalles?",
      subtitle2: "Describe qué estabas haciendo cuando ocurrió el error:",
      labelName: "Tu nombre",
      labelEmail: "Tu email",
      labelComments: "Descripción",
      labelClose: "Cerrar",
      labelSubmit: "Enviar reporte",
      errorGeneric: "Ocurrió un error al enviar el reporte. Por favor inténtalo de nuevo.",
      errorFormEntry: "Por favor completa todos los campos.",
      successMessage: "¡Gracias! Tu feedback nos ayuda a mejorar.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl">¡Ups! Algo salió mal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado 
            y estamos trabajando para solucionarlo.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-muted p-4 rounded-lg overflow-auto">
              <p className="text-sm font-mono text-red-400">{error.message}</p>
              <pre className="text-xs text-muted-foreground mt-2 overflow-auto">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="grid gap-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar de nuevo
            </Button>

            <Button variant="outline" onClick={handleReportError} className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Reportar error
            </Button>

            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
