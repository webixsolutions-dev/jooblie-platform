import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLayout } from "./components/DashboardLayout";
import { Layout } from "./components/Layout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireRole } from "./components/RequireRole";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { JobsPage } from "./pages/JobsPage";
import { JobApplicantsPage } from "./pages/JobApplicantsPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CompanyCreationPage } from "./pages/CompanyCreationPage";
import { RecruiterDashboardPage } from "./pages/RecruiterDashboardPage";
import { RecruiterJobFormPage } from "./pages/RecruiterJobFormPage";
import { RecruiterJobsPage } from "./pages/RecruiterJobsPage";
import { SignupPage } from "./pages/SignupPage";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/check-email" element={<CheckEmailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          element={
            <RequireRole role="job_seeker">
              <DashboardLayout role="job_seeker" />
            </RequireRole>
          }
        >
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          <Route
            path="/saved"
            element={<DashboardPage focus="saved" />}
          />
        </Route>
        <Route
          element={
            <RequireRole role="recruiter">
              <DashboardLayout role="recruiter" />
            </RequireRole>
          }
        >
          <Route
            path="/recruiter"
            element={<RecruiterDashboardPage />}
          />
          <Route
            path="/recruiter/company/new"
            element={<CompanyCreationPage />}
          />
          <Route
            path="/recruiter/jobs"
            element={<RecruiterJobsPage />}
          />
          <Route
            path="/recruiter/jobs/new"
            element={<RecruiterJobFormPage />}
          />
          <Route
            path="/recruiter/jobs/:id/applicants"
            element={<JobApplicantsPage />}
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
