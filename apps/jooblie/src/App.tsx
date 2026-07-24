import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
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
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/check-email" element={<CheckEmailPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole role="job_seeker">
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/saved"
            element={
              <RequireRole role="job_seeker">
                <DashboardPage focus="saved" />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter"
            element={
              <RequireRole role="recruiter">
                <RecruiterDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/company/new"
            element={
              <RequireRole role="recruiter">
                <CompanyCreationPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <RequireRole role="recruiter">
                <RecruiterJobsPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <RequireRole role="recruiter">
                <RecruiterJobFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/:id/applicants"
            element={
              <RequireRole role="recruiter">
                <JobApplicantsPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
