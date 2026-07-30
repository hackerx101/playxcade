import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { FeedPage } from './pages/FeedPage';
import { ForYouPage } from './pages/ForYouPage';
import { ExplorePage } from './pages/ExplorePage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { SSOPage } from './pages/SSOPage';
import { SuspendedPage } from './pages/SuspendedPage';
import { AppealPage } from './pages/AppealPage';
import { IdentityVerifyPage } from './pages/IdentityVerifyPage';
import { TOSPage } from './pages/TOSPage';
import { AuthVerifyPage } from './pages/AuthVerifyPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { CloudGamingPage } from './pages/CloudGamingPage';
import { HackedAccountPage } from './pages/HackedAccountPage';
import { ProfileSetupModal } from './components/ProfileSetupModal';

// Protected route wrapper that checks if user is logged in and not suspended
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user && user.account_status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ProfileSetupModal />
      <BrowserRouter>
        <Routes>
          {/* Public Landing, Auth & Cloud Gaming */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cloud" element={<CloudGamingPage />} />
          <Route path="/auth font" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/auth/verify/:token" element={<AuthVerifyPage />} />
          <Route path="/password/reset" element={<PasswordResetPage />} />
          <Route path="/password/reset/:token" element={<PasswordResetPage />} />
          <Route path="/account/verify/hacked" element={<HackedAccountPage />} />
          <Route path="/account/id/verify" element={<IdentityVerifyPage />} />
          <Route path="/sso" element={<SSOPage />} />
          <Route path="/tos font" element={<TOSPage />} />
          <Route path="/tos" element={<TOSPage />} />

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
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
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
