import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlatformDataProvider } from "@/contexts/PlatformDataContext";
import { ChatDockProvider } from "@/contexts/ChatDockContext";
import LandingPage from "./pages/LandingPage";
import { CookieConsent } from "@/components/CookieConsent";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const MyPostsPage = lazy(() => import("./pages/MyPostsPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const CreateEditPostPage = lazy(() => import("./pages/CreateEditPostPage"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminPostsPage = lazy(() => import("./pages/AdminPostsPage"));
const AdminLogsPage = lazy(() => import("./pages/AdminLogsPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

export const ProtectedRoute = ({
  children,
  allowIncomplete = false,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  allowIncomplete?: boolean;
  requireAdmin?: boolean;
}) => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  // F-01: hard-loads land here before /api/auth/me resolves. Without this
  // guard the first render sees isAuthenticated=false (token in localStorage
  // but currentUser still null) and redirects to /login, even though the
  // user is logged in. Returning null defers the redirect until bootstrap
  // settles.
  if (loading) {
    return null;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    !allowIncomplete &&
    currentUser.role !== "admin" &&
    !currentUser.onboardingCompleted
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowIncomplete && currentUser.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/terms" element={<TermsOfServicePage />} />
    <Route
      path="/onboarding"
      element={
        <ProtectedRoute allowIncomplete>
          <OnboardingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/explore"
      element={
        <ProtectedRoute>
          <ExplorePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/my-posts"
      element={
        <ProtectedRoute>
          <MyPostsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/posts/:id"
      element={
        <ProtectedRoute>
          <PostDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/create-post"
      element={
        <ProtectedRoute>
          <CreateEditPostPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/edit-post/:id"
      element={
        <ProtectedRoute>
          <CreateEditPostPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/meetings"
      element={
        <ProtectedRoute>
          <MeetingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute requireAdmin>
          <AdminDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute requireAdmin>
          <AdminUsersPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/posts"
      element={
        <ProtectedRoute requireAdmin>
          <AdminPostsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/logs"
      element={
        <ProtectedRoute requireAdmin>
          <AdminLogsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/stats"
      element={
        <ProtectedRoute requireAdmin>
          <AdminStatsPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PlatformDataProvider>
        <AuthProvider>
          <ChatDockProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteLoadingFallback />}>
                <AppRoutes />
              </Suspense>
              <CookieConsent />
            </BrowserRouter>
          </ChatDockProvider>
        </AuthProvider>
      </PlatformDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
