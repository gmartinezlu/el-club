import { Outlet } from "react-router-dom";
import { RoleShell } from "./RoleShell";
import { BarChart2, Users, Activity, LifeBuoy, FileText, Bell, Settings } from "lucide-react";

export function AdminLayout() {
  return (
    <RoleShell
      role="admin"
      nav={[
        // Consolidated: Control / Operacion / Cuenta
        { to: "/admin", label: "Resumen", end: true, group: "Control", icon: BarChart2 },
        { to: "/admin/psychologists", label: "Psicólogas", group: "Control", icon: Users },

        { to: "/admin/activity", label: "Actividad", group: "Operación", icon: Activity },
        { to: "/admin/support", label: "Soporte", group: "Operación", icon: LifeBuoy },
        { to: "/admin/content", label: "Contenido", group: "Operación", icon: FileText },

        { to: "/admin/notifications", label: "Avisos", group: "Cuenta", icon: Bell },
        { to: "/admin/settings", label: "Configuración", group: "Cuenta", icon: Settings },
      ]}
    >
      <Outlet />
    </RoleShell>
  );
}
