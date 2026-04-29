import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlatformDataProvider } from "@/contexts/PlatformDataContext";
import { ChatDockProvider } from "@/contexts/ChatDockContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorePage from "./pages/ExplorePage";
import MyPostsPage from "./pages/MyPostsPage";
import PostDetailPage from "./pages/PostDetailPage";
import CreateEditPostPage from "./pages/CreateEditPostPage";
import MeetingsPage from "./pages/MeetingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPostsPage from "./pages/AdminPostsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import OnboardingPage from "./pages/OnboardingPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NotFound from "./pages/NotFound";
import { CookieConsent } from "@/components/CookieConsent";

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
  const { currentUser, isAuthenticated } = useAuth();

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
              <AppRoutes />
              <CookieConsent />
            </BrowserRouter>
          </ChatDockProvider>
        </AuthProvider>
      </PlatformDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
