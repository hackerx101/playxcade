import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getFeatureFlags } from './config/featureFlags';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { FeedPage } from './pages/FeedPage';
import { ForYouPage } from './pages/ForYouPage';
import { ExplorePage } from './pages/ExplorePage';
import { ChatPage } from './pages/ChatPage';
import { ChannelSettingsPage } from './pages/ChannelSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FollowsPage } from './pages/FollowsPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { SSOPage } from './pages/SSOPage';
import { SuspendedPage } from './pages/SuspendedPage';
import { AppealPage } from './pages/AppealPage';
import { IdentityVerifyPage } from './pages/IdentityVerifyPage';
import { TOSPage } from './pages/TOSPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AuthVerifyPage } from './pages/AuthVerifyPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { CloudGamingPage } from './pages/CloudGamingPage';
import { HackedAccountPage } from './pages/HackedAccountPage';
import { MigratingPage } from './pages/MigratingPage';
import { AIPage } from './pages/AIPage';

import { DeactivatedPage } from './pages/DeactivatedPage';
import { SetupProfilePage } from './pages/SetupProfilePage';
import { GeoBlockOverlay } from './components/GeoBlockOverlay';
import { GlobalCallManager } from './components/GlobalCallManager';
import { OfflineScreen } from './components/OfflineScreen';
import { TakedownWarningOverlay } from './components/TakedownWarningOverlay';

// Protected route wrapper that checks if user is logged in and not suspended, deactivated, or migrating
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const flags = getFeatureFlags();

  if (flags.is_migration || flags.migration_status === 'pending') {
    return <Navigate to="/migrating" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user && user.account_status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  if (user && user.account_status === 'deactivated') {
    return <Navigate to="/deactivated" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <GeoBlockOverlay />
      <GlobalCallManager />
      <OfflineScreen />
      <TakedownWarningOverlay />
      <BrowserRouter>
        <Routes>
          {/* Public Landing, Auth & Migration */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/cloud" element={<CloudGamingPage />} />
          <Route path="/migrating" element={<MigratingPage />} />
          
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/sso/third" element={<AuthPage defaultEngine="firebase" />} />
          <Route path="/ssso/third" element={<AuthPage defaultEngine="firebase" />} />
          <Route path="/auth/failover" element={<AuthPage />} />
          <Route path="/auth/supabase" element={<AuthPage />} />
          
          <Route path="/setup-profile" element={<SetupProfilePage />} />
          <Route path="/onboarding" element={<SetupProfilePage />} />
          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/auth/verify/:token" element={<AuthVerifyPage />} />
          <Route path="/password/reset" element={<PasswordResetPage />} />
          <Route path="/password/reset/:token" element={<PasswordResetPage />} />
          <Route path="/account/verify/hacked" element={<HackedAccountPage />} />
          <Route path="/account/id/verify" element={<IdentityVerifyPage />} />
          <Route path="/sso" element={<SSOPage />} />
          
          <Route path="/tos" element={<TOSPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* Social Network Routes */}
          <Route
            path="/feed font"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/foryou"
            element={
              <ProtectedRoute>
                <ForYouPage />
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
            path="/search"
            element={
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dm"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:username"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channel/:channelId/settings"
            element={
              <ProtectedRoute>
                <ChannelSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chanell/:channelId/settings"
            element={
              <ProtectedRoute>
                <ChannelSettingsPage />
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
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username/follows"
            element={
              <ProtectedRoute>
                <FollowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:postId"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:token"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gift/:plan"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gift"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <ProtectedRoute>
                <PostDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Suspension & Appeals Flow */}
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="/deactivated" element={<DeactivatedPage />} />
          <Route path="/appeal" element={<AppealPage />} />
          <Route path="/verify" element={<IdentityVerifyPage />} />
          <Route path="/appeal/verify/identity" element={<IdentityVerifyPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
