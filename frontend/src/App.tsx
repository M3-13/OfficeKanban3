import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BoardListPage from "./pages/BoardListPage";
import BoardPage from "./pages/BoardPage";
import { ProtectedRoute } from "./hooks/useAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="boards" element={<BoardListPage />} />
        <Route path="boards/:id" element={<BoardPage />} />
      </Route>
    </Routes>
  );
}
