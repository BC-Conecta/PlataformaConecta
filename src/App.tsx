import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { PasswordRecoveryPage, ResetPasswordPage } from "./pages/PasswordPages";
import { PeoplePage } from "./pages/PeoplePage";
import { GroupsPage } from "./pages/GroupsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { CalendarPage } from "./pages/CalendarPage";
import { JournalPage } from "./pages/JournalPage";
import { ReportsPage } from "./pages/ReportsPage";
import { DashboardPage, SettingsPage, TestsPage } from "./pages/OtherPages";

function Protected() {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<PasswordRecoveryPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route element={<Protected />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pessoas" element={<PeoplePage />} />
        <Route path="/turmas" element={<GroupsPage />} />
        <Route path="/aulas" element={<SchedulePage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/diario" element={<JournalPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/testes" element={<TestsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
