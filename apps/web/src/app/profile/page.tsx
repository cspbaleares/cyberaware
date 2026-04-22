"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Building, Shield, Key, Bell, Palette } from "lucide-react";

interface ProfilePageProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    tenantName: string;
    tenantSlug: string;
    roles: string[];
    isSuperAdmin: boolean;
    enabledModules: string[];
    createdAt: string;
    lastLogin?: string;
  };
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email,
  });

  const handleSave = async () => {
    // TODO: Implement API call to update profile
    toast({
      title: "Perfil actualizado",
      description: "Tus cambios han sido guardados correctamente.",
    });
    setIsEditing(false);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      platform_admin: "Administrador de Plataforma",
      tenant_admin: "Administrador de Tenant",
      user: "Usuario",
      analyst: "Analista",
    };
    return labels[role] || role;
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      module_1: "Simulación",
      module_2: "Riesgo Humano",
      module_3: "Formación",
      module_4: "Automatización",
    };
    return labels[module] || module;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Perfil de Usuario
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Sidebar - User Info */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                  {user.email[0].toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email.split("@")[0]}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {user.isSuperAdmin && (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                      Super Admin
                    </Badge>
                  )}
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {getRoleLabel(role)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Información de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Organización:</span>
                  <span className="ml-auto font-medium">{user.tenantName}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-auto font-medium">{user.tenantSlug}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Miembro desde:</span>
                  <span className="ml-auto font-medium">
                    {new Date(user.createdAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center text-sm">
                    <Bell className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Último acceso:</span>
                    <span className="ml-auto font-medium">
                      {new Date(user.lastLogin).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? "Guardar Cambios" : "Editar Perfil"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tus apellidos"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <h4 className="font-medium">Contraseña</h4>
                    <p className="text-sm text-muted-foreground">
                      Última actualización: hace 30 días
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Cambiar Contraseña
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <h4 className="font-medium">Autenticación de Dos Factores (2FA)</h4>
                    <p className="text-sm text-muted-foreground">
                      Añade una capa extra de seguridad a tu cuenta
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Módulos Habilitados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {user.enabledModules.map((module) => (
                    <div
                      key={module}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-cyan-400">
                            {getModuleLabel(module)[0]}
                          </span>
                        </div>
                        <span className="font-medium">{getModuleLabel(module)}</span>
                      </div>
                      <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                        Activo
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Alertas de seguridad", desc: "Notificaciones sobre eventos de seguridad", default: true },
                  { label: "Reportes semanales", desc: "Resumen semanal de actividad", default: true },
                  { label: "Actualizaciones de plataforma", desc: "Nuevas funciones y mejoras", default: false },
                  { label: "Emails de marketing", desc: "Promociones y novedades", default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{item.label}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={item.default}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
