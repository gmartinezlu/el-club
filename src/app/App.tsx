import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { AuthLayout } from "../layouts/auth/AuthLayout";
import { PatientLayout } from "../layouts/role/PatientLayout";
import { PsychologistLayout } from "../layouts/role/PsychologistLayout";
import { AdminLayout } from "../layouts/role/AdminLayout";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";

function lazyPage<T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as ComponentType<Record<string, unknown>> };
  });
}

const LandingPage = lazyPage(
  () => import("../pages/LandingPage"),
  "LandingPage",
);
const ExperiencesPage = lazyPage(
  () => import("../pages/ExperiencesPage"),
  "ExperiencesPage",
);
const CommunityPage = lazyPage(
  () => import("../pages/CommunityPage"),
  "CommunityPage",
);
const BlogPage = lazyPage(() => import("../pages/BlogPage"), "BlogPage");
const TherapyPage = lazyPage(
  () => import("../pages/TherapyPage"),
  "TherapyPage",
);
const ForPsychologistsPage = lazyPage(
  () => import("../pages/ForPsychologistsPage"),
  "ForPsychologistsPage",
);
const LegalPage = lazyPage(() => import("../pages/LegalPage"), "LegalPage");
const SupportPage = lazyPage(
  () => import("../pages/SupportPage"),
  "SupportPage",
);
const AuthEntryPage = lazyPage(
  () => import("../pages/auth/AuthEntryPage"),
  "AuthEntryPage",
);
const LoginPage = lazyPage(
  () => import("../pages/auth/LoginPage"),
  "LoginPage",
);
const RegisterPage = lazyPage(
  () => import("../pages/auth/RegisterPage"),
  "RegisterPage",
);
const ForgotPasswordPage = lazyPage(
  () => import("../pages/auth/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const ResetPasswordPage = lazyPage(
  () => import("../pages/auth/ResetPasswordPage"),
  "ResetPasswordPage",
);
const OnboardingRolePage = lazyPage(
  () => import("../pages/auth/OnboardingRolePage"),
  "OnboardingRolePage",
);
const NotificationsPage = lazyPage(
  () => import("../notifications/NotificationsPage"),
  "NotificationsPage",
);
const CrisisChatPage = lazyPage(
  () => import("../crisis-chat/CrisisChatPage"),
  "CrisisChatPage",
);

const PatientDashboardPage = lazyPage(
  () => import("../patient/pages/Dashboard"),
  "PatientDashboardPage",
);
const PatientResourcesPage = lazyPage(
  () => import("../patient/pages/ResourcesPage"),
  "PatientResourcesPage",
);
const PatientJournalsPage = lazyPage(
  () => import("../patient/pages/JournalsPage"),
  "PatientJournalsPage",
);
const PatientMeditationsPage = lazyPage(
  () => import("../patient/pages/MeditationsPage"),
  "PatientMeditationsPage",
);
const PatientSessionsPage = lazyPage(
  () => import("../patient/pages/SessionsPage"),
  "PatientSessionsPage",
);
const PatientPsychologistsPage = lazyPage(
  () => import("../patient/pages/PsychologistsPage"),
  "PatientPsychologistsPage",
);
const PatientAppointmentRequestPage = lazyPage(
  () => import("../patient/pages/AppointmentRequestPage"),
  "PatientAppointmentRequestPage",
);
const SessionRoomPage = lazyPage(
  () => import("../patient/pages/SessionRoomPage"),
  "SessionRoomPage",
);
const PatientSettingsPage = lazyPage(
  () => import("../patient/pages/SettingsPage"),
  "PatientSettingsPage",
);
const PatientOnboardingPage = lazyPage(
  () => import("../patient/pages/OnboardingPage"),
  "PatientOnboardingPage",
);

const PsychologistDashboardPage = lazyPage(
  () => import("../psychologist/pages/Dashboard"),
  "PsychologistDashboardPage",
);
const PsychologistAvailabilityPage = lazyPage(
  () => import("../psychologist/pages/AvailabilityPage"),
  "PsychologistAvailabilityPage",
);
const PsychologistPatientsPage = lazyPage(
  () => import("../psychologist/pages/PatientsPage"),
  "PsychologistPatientsPage",
);
const PsychologistNotesPage = lazyPage(
  () => import("../psychologist/pages/NotesPage"),
  "PsychologistNotesPage",
);
const PsychologistMetricsPage = lazyPage(
  () => import("../psychologist/pages/MetricsPage"),
  "PsychologistMetricsPage",
);
const PsychologistSettingsPage = lazyPage(
  () => import("../psychologist/pages/SettingsPage"),
  "PsychologistSettingsPage",
);

const AdminOverviewPage = lazyPage(
  () => import("../admin/pages/OverviewPage"),
  "AdminOverviewPage",
);
const AdminPsychologistsPage = lazyPage(
  () => import("../admin/pages/PsychologistsPage"),
  "AdminPsychologistsPage",
);
const AdminActivityPage = lazyPage(
  () => import("../admin/pages/ActivityPage"),
  "AdminActivityPage",
);
const AdminSupportPage = lazyPage(
  () => import("../admin/pages/SupportPage"),
  "AdminSupportPage",
);
const AdminContentPage = lazyPage(
  () => import("../admin/pages/ContentPage"),
  "AdminContentPage",
);
const AdminSettingsPage = lazyPage(
  () => import("../admin/pages/SettingsPage"),
  "AdminSettingsPage",
);

function RouteFallback() {
  return <div className="min-h-screen bg-club-cream" />;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <Suspense fallback={<RouteFallback />}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "1rem",
            border: "1px solid rgba(8, 71, 57, 0.1)",
            background: "rgba(255, 255, 255, 0.9)",
            color: "#1f2a26",
            boxShadow: "0 12px 32px -12px rgba(8, 71, 57, 0.25)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/experiencias" element={<ExperiencesPage />} />
        <Route path="/comunidad" element={<CommunityPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/terapia" element={<TherapyPage />} />
        <Route path="/para-psicologos" element={<ForPsychologistsPage />} />
        <Route path="/privacidad" element={<LegalPage type="privacy" />} />
        <Route path="/terminos" element={<LegalPage type="terms" />} />
        <Route path="/soporte" element={<SupportPage />} />

        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="/auth/patient" replace />} />
          <Route path="patient" element={<AuthEntryPage portal="patient" />} />
          <Route
            path="psychologist"
            element={<AuthEntryPage portal="psychologist" />}
          />
          <Route
            path="login"
            element={<Navigate to="/auth/patient/login" replace />}
          />
          <Route
            path="register"
            element={<Navigate to="/auth/patient/register" replace />}
          />
          <Route path="patient/login" element={<LoginPage role="patient" />} />
          <Route
            path="patient/register"
            element={<RegisterPage role="patient" />}
          />
          <Route
            path="psychologist/login"
            element={<LoginPage role="psychologist" />}
          />
          <Route
            path="psychologist/register"
            element={<RegisterPage role="psychologist" />}
          />
          <Route path="admin/login" element={<LoginPage role="admin" />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="onboarding" element={<OnboardingRolePage />} />
        </Route>

        <Route element={<RequireAuth />}>
          {/* Onboarding needs to be a focused, full-screen flow without the sidebar */}
          <Route path="patient/onboarding" element={<PatientOnboardingPage />} />

          <Route
            path="patient/*"
            element={
              <RequireRole role="patient">
                <PatientLayout />
              </RequireRole>
            }
          >
            <Route index element={<PatientDashboardPage />} />
            <Route path="session/:appointmentId" element={<SessionRoomPage />} />
            <Route
              path="requests/:appointmentId"
              element={<PatientAppointmentRequestPage />}
            />
            <Route path="psychologists" element={<PatientPsychologistsPage />} />
            <Route
              path="psychologists/:psychologistId"
              element={<PatientPsychologistsPage />}
            />
            <Route path="resources" element={<PatientResourcesPage />} />
            <Route path="journals" element={<PatientJournalsPage />} />
            <Route path="meditations" element={<PatientMeditationsPage />} />
            <Route path="sessions" element={<PatientSessionsPage />} />
            <Route
              path="crisis-chat"
              element={<CrisisChatPage mode="patient" />}
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<PatientSettingsPage />} />
          </Route>

          <Route
            path="psychologist/*"
            element={
              <RequireRole role="psychologist">
                <PsychologistLayout />
              </RequireRole>
            }
          >
            <Route index element={<PsychologistDashboardPage />} />
            <Route
              path="availability"
              element={<PsychologistAvailabilityPage />}
            />
            <Route path="patients" element={<PsychologistPatientsPage />} />
            <Route path="patients/:patientId" element={<PsychologistPatientsPage />} />
            <Route path="notes" element={<PsychologistNotesPage />} />
            <Route
              path="crisis-chat"
              element={<CrisisChatPage mode="psychologist" />}
            />
            <Route path="metrics" element={<PsychologistMetricsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<PsychologistSettingsPage />} />
          </Route>

          <Route
            path="admin/*"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="psychologists" element={<AdminPsychologistsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </MotionConfig>
  );
}
