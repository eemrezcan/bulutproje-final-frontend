import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { IotPage } from "./pages/IotPage";
import { MlAnalyticsPage } from "./pages/MlAnalyticsPage";
import { VideoPage } from "./pages/VideoPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/iot" element={<IotPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/ml" element={<MlAnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
