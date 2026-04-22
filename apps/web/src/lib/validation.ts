import { z } from "zod";

// Validación de usuario
export const userSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  role: z.enum(["user", "analyst", "tenant_admin", "platform_admin"]),
});

// Validación de campaña de phishing
export const campaignSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  templateId: z.string().uuid("ID de plantilla inválido"),
  targetGroups: z.array(z.string()).min(1, "Debe seleccionar al menos un grupo"),
  scheduledAt: z.date().optional(),
  sendImmediately: z.boolean().default(false),
});

// Validación de tenant
export const tenantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  slug: z.string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  email: z.string().email("Email inválido"),
  enabledModules: z.array(z.enum(["module_1", "module_2", "module_3", "module_4"])),
});

// Validación de curso de formación
export const courseSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(200),
  description: z.string().max(2000).optional(),
  duration: z.number().min(1, "La duración debe ser al menos 1 minuto"),
  category: z.enum(["basics", "phishing", "passwords", "compliance", "advanced"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

// Validación de regla de automatización
export const automationRuleSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  trigger: z.enum(["phishing_click", "risk_score_high", "course_incomplete", "login_suspicious"]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "greater_than", "less_than", "contains"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })),
  actions: z.array(z.object({
    type: z.enum(["send_email", "enroll_course", "notify_admin", "block_user"]),
    params: z.record(z.any()),
  })).min(1, "Debe tener al menos una acción"),
  enabled: z.boolean().default(true),
});

// Helper para validar formularios
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}

// Exportar tipos
export type UserInput = z.infer<typeof userSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type AutomationRuleInput = z.infer<typeof automationRuleSchema>;
