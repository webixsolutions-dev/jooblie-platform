import { Navigate, Route, Routes } from "react-router-dom";

import { AdminGuard } from "./components/AdminGuard";
import { AdminShell } from "./components/AdminShell";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
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
            element={<PlaceholderPage title="Companies" />}
          />
          <Route
            path="jobs"
            element={<PlaceholderPage title="Jobs" />}
          />
          <Route
            path="applications"
            element={<PlaceholderPage title="Applications" />}
          />
          <Route
            path="users"
            element={<PlaceholderPage title="Users" />}
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
