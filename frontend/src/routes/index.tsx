import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import LoadingState from "@/components/LoadingState";

import MainLayout from "@/layouts/MainLayout";
import MainLayoutUser from "@/layouts/MainLayoutUser";
import AdminLayout from "@/layouts/AdminLayout";
import CoachLayout from "@/layouts/CoachLayout";

import LandingPage from "@/pages/Landing";
import ExercisesPage from "@/pages/Exercises";
import CommunityPage from "@/pages/Community";
import HelpPage from "@/pages/Help";
import AccountPage from "@/pages/Account";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/OAuth/OAuth2Callback";
import ForgotPassword from "@/pages/Password/ForgotPassword";
import ResetPassword from "@/pages/Password/ResetPassword";
import TermsAndConditions from "@/pages/PrivacyPolicy/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy/PrivacyPolicy";
import ExploreWorkouts from "@/pages/Explore/ExploreWorkouts";
import ProgressPage from "@/pages/Progress";
import Notifications from "@/pages/Notifications";
import UserAdmin from "@/pages/Admin/UserAdmin";
import ExerciseAdmin from "@/pages/Admin/ExercisesAdmin";
import Dashboard from "@/pages/Admin/Dashboard";
import Community from "@/pages/Community";
import CommunityAdmin from "@/pages/Admin/CommunityAdmin/index";
import ProgramsAdmin from "@/pages/Admin/ProgramsAdmin";
import CoachDashboard from "@/pages/Coach/Dashboard";
import CoachClients from "@/pages/Coach/Clients";
import CoachPrograms from "@/pages/Coach/Programs";
import WorkoutSessionsPage from "@/pages/WorkoutSessions";
import ExploreWorkoutsDetaislPage from "@/pages/Explore/ExploreWorkoutsDetais";
import PaymentCallback from "@/pages/Payment/PaymentCallback";

// Lazy loaded components
const BookingPage = lazy(() => import("@/pages/Booking"));
const UserMessagesPage = lazy(() => import("@/pages/Messages"));
const CoachSchedulePage = lazy(() => import("@/pages/Coach/Schedule"));
const CoachMessagesPage = lazy(() => import("@/pages/Coach/Messages"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayoutUser />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CommunityPage /> },
      { path: "exercises", element: <ExercisesPage /> },
      { path: "explore", element: <ExploreWorkouts /> },
      { path: "explore/:id", element:<ExploreWorkoutsDetaislPage /> },
      { path: "workouts", element: <WorkoutSessionsPage /> },
      { path: "workoutsessions", element: <WorkoutSessionsPage /> }, // Keep for backward compatibility
      { path: "progress", element: <ProgressPage /> },
      { path: "profile", element: <AccountPage /> },
      { path: "notifications", element: <Notifications /> },
      { path: "booking", element: <Suspense fallback={<LoadingState />}><BookingPage /></Suspense> },
      { path: "messages", element: <Suspense fallback={<LoadingState />}><UserMessagesPage /></Suspense> }
    ],
  },

  // --- ADMIN
  {
    path: "/admin",
    element: (
      <ProtectedRoute role={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "users", element: <UserAdmin /> },
      { path: "exercises", element: <ExerciseAdmin /> },
      { path: "programs", element: <ProgramsAdmin /> },
      { path: "community", element: <CommunityAdmin /> }
    ],
  },

  // --- COACH
  {
    path: "/coach",
    element: (
      <ProtectedRoute role="ROLE_COACH">
        <CoachLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CoachDashboard /> },
      { path: "dashboard", element: <CoachDashboard /> },
      { path: "clients", element: <CoachClients /> },
      { path: "programs", element: <CoachPrograms /> },
      { path: "schedule", element: <Suspense fallback={<LoadingState />}><CoachSchedulePage /></Suspense> },
      { path: "messages", element: <Suspense fallback={<LoadingState />}><CoachMessagesPage /></Suspense> }
    ],
  },

  // --- PUBLIC
  {
    path: "/fr",
    element: (
      <PublicRoute>
        <MainLayout />
      </PublicRoute>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: "explore", element: <ExploreWorkouts /> },
      { path: "exercises", element: <ExercisesPage /> },
      { path: "community", element: <Community /> },
      { path: "helps", element: <HelpPage /> },
    ],
  },

  // --- AUTH
  { path: "/auth/login", element: <Login /> },
  { path: "/auth/register", element: <Register /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/auth/forgot-password", element: <ForgotPassword /> },
  { path: "/auth/reset-password", element: <ResetPassword /> },
  { path: "/auth/terms", element: <TermsAndConditions /> },
  { path: "/auth/privacy", element: <PrivacyPolicy /> },
  
  // --- PAYMENT
  { path: "/payment/callback", element: <ProtectedRoute><PaymentCallback /></ProtectedRoute> },
]);
