import { Navigate, Route, Routes } from "react-router-dom";

import { AdminGuard } from "./components/AdminGuard";
import { AdminShell } from "./components/AdminShell";
import { CompaniesPage } from "./pages/CompaniesPage";
import { JobsPage } from "./pages/JobsPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { UsersPage } from "./pages/UsersPage";
import { VerificationPage } from "./pages/VerificationPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminGuard />}>
        <Route element={<AdminShell />}>
          <Route
            index
            element={<PlaceholderPage title="Dashboard" />}
          />
          <Route
            path="verification"
            element={<VerificationPage />}
          />
          <Route
            path="companies"
            element={<CompaniesPage />}
          />
          <Route
            path="jobs"
            element={<JobsPage />}
          />
          <Route
            path="applications"
            element={<PlaceholderPage title="Applications" />}
          />
          <Route
            path="users"
            element={<UsersPage />}
          />
          <Route
            path="activity"
            element={<PlaceholderPage title="Activity" />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
