import { Outlet } from "react-router-dom";
import { RoleShell } from "./RoleShell";
import { BarChart2, Users, CreditCard, Activity, LifeBuoy, FileText, Bell, Settings } from "lucide-react";

export function AdminLayout() {
  return (
    <RoleShell
      role="admin"
      nav={[
        // Consolidated: Control / Operacion / Cuenta
        { to: "/admin", label: "Resumen", end: true, group: "Control", icon: BarChart2 },
        { to: "/admin/psychologists", label: "Psicologas", group: "Control", icon: Users },
        { to: "/admin/memberships", label: "Membresias", group: "Control", icon: CreditCard },

        { to: "/admin/activity", label: "Actividad", group: "Operacion", icon: Activity },
        { to: "/admin/support", label: "Soporte", group: "Operacion", icon: LifeBuoy },
        { to: "/admin/content", label: "Contenido", group: "Operacion", icon: FileText },

        { to: "/admin/notifications", label: "Avisos", group: "Cuenta", icon: Bell },
        { to: "/admin/settings", label: "Configuracion", group: "Cuenta", icon: Settings },
      ]}
    >
      <Outlet />
    </RoleShell>
  );
}
