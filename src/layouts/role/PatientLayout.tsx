import { Outlet } from "react-router-dom";
import { RoleShell } from "./RoleShell";
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  FileText,
  Sparkles,
  Bell,
  Settings,
} from "lucide-react";

export function PatientLayout() {
  return (
    <RoleShell
      role="patient"
      nav={[
        // Consolidated groups: Principal / Terapia / Cuenta
        { to: "/patient", label: "Inicio", end: true, group: "Principal", icon: Home },

        { to: "/patient/psychologists", label: "Especialistas", group: "Terapia", icon: Users },
        { to: "/patient/sessions", label: "Sesiones", group: "Terapia", icon: Calendar },
        { to: "/patient/crisis-chat", label: "Chat crisis", group: "Terapia", icon: MessageSquare },
        { to: "/patient/resources", label: "Recursos", group: "Terapia", icon: BookOpen },
        { to: "/patient/journals", label: "Journal", group: "Terapia", icon: FileText },
        { to: "/patient/meditations", label: "Meditar", group: "Terapia", icon: Sparkles },

        { to: "/patient/notifications", label: "Avisos", group: "Cuenta", icon: Bell },
        { to: "/patient/settings", label: "Ajustes", group: "Cuenta", icon: Settings },
      ]}
    >
      <Outlet />
    </RoleShell>
  );
}
