import { Outlet } from "react-router-dom";
import { RoleShell } from "./RoleShell";
import { Calendar, Clock, Users, FileText, MessageSquare, BarChart2, Bell, Settings } from "lucide-react";

export function PsychologistLayout() {
  return (
    <RoleShell
      role="psychologist"
      nav={[
        // Consolidated: Consulta / Gestion / Cuenta
        { to: "/psychologist", label: "Agenda", end: true, group: "Consulta", icon: Calendar },
        { to: "/psychologist/availability", label: "Disponibilidad", group: "Consulta", icon: Clock },
        { to: "/psychologist/patients", label: "Personas", group: "Consulta", icon: Users },
        { to: "/psychologist/notes", label: "Notas", group: "Consulta", icon: FileText },
        { to: "/psychologist/crisis-chat", label: "Chat crisis", group: "Consulta", icon: MessageSquare },

        { to: "/psychologist/metrics", label: "Metricas", group: "Gestion", icon: BarChart2 },

        { to: "/psychologist/notifications", label: "Avisos", group: "Cuenta", icon: Bell },
        { to: "/psychologist/settings", label: "Configuracion", group: "Cuenta", icon: Settings },
      ]}
    >
      <Outlet />
    </RoleShell>
  );
}
