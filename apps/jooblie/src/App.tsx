import { Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { RequireRole } from "./components/RequireRole";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SignupPage } from "./pages/SignupPage";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/jobs"
            element={
              <PlaceholderPage
                title="Browse jobs"
                description="Job search is coming in the next launch slice."
              />
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <PlaceholderPage
                title="Job details"
                description="Job details are coming in the next launch slice."
              />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/check-email" element={<CheckEmailPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole role="job_seeker">
                <PlaceholderPage
                  title="Your dashboard"
                  description="Applications and recommendations will appear here."
                />
              </RequireRole>
            }
          />
          <Route
            path="/saved"
            element={
              <RequireRole role="job_seeker">
                <PlaceholderPage
                  title="Saved jobs"
                  description="Your saved jobs will appear here."
                />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter"
            element={
              <RequireRole role="recruiter">
                <PlaceholderPage
                  title="Recruiter workspace"
                  description="Your hiring overview will appear here."
                />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <RequireRole role="recruiter">
                <PlaceholderPage
                  title="My jobs"
                  description="Your job listings will appear here."
                />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <RequireRole role="recruiter">
                <PlaceholderPage
                  title="Post a job"
                  description="Job posting is coming in a later launch slice."
                />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
