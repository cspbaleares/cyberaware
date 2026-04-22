"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-orange-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Sin conexión a Internet
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8">
            Parece que has perdido la conexión. Algunas funciones de CyberAware 
            están disponibles offline, pero necesitarás conexión para acceder 
            a datos en tiempo real.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar de nuevo
            </Button>

            <Link href="/" className="block">
              <Button 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>

          {/* Cached content info */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Contenido disponible offline:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Página de inicio</li>
              <li>• Perfil de usuario</li>
              <li>• Dashboard (datos cacheados)</li>
              <li>• Formularios (se sincronizarán al reconectar)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
