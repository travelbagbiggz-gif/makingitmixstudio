import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FineTuneMixPage from './pages/fine-tune-mix-page';
import RecordingStudio from './pages/recording-studio';
import HomePage from './pages/home-page';
import MasteringPage from './pages/mastering-page';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AccountManagement from './pages/account-management';
import ProjectManagement from './pages/project-management';
import TermsOfServiceModal from './pages/terms-of-service-modal';
import PrivacyPolicyModal from './pages/privacy-policy-modal';
import DmcaContentPolicyModal from './pages/dmca-content-policy-modal';
import AdminPanel from './pages/admin-panel';
import { AuthProvider } from './contexts/AuthContext';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/account-management" element={<AccountManagement />} />
          <Route path="/project-management" element={<ProjectManagement />} />
          <Route path="/terms-of-service-modal" element={<TermsOfServiceModal />} />
          <Route path="/privacy-policy-modal" element={<PrivacyPolicyModal />} />
          <Route path="/dmca-content-policy-modal" element={<DmcaContentPolicyModal />} />
          <Route path="/fine-tune-mix-page" element={<FineTuneMixPage />} />
          <Route path="/recording-studio" element={<RecordingStudio />} />
          <Route path="/home-page" element={<HomePage />} />
          <Route path="/mastering-page" element={<MasteringPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
