import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ChatWidget from "./features/ai/ChatWidget";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const MapSearchPage = lazy(() => import("./pages/MapSearchPage"));
const PropertyPage = lazy(() => import("./pages/PropertyPage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const HostDashboard = lazy(() => import("./pages/host/HostDashboard"));
const BecomeHostPage = lazy(() => import("./pages/host/BecomeHostPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-16 text-center text-slate-400">Loading…</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/map" element={<MapSearchPage />} />
            <Route path="/property/:slug" element={<PropertyPage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/become-a-host" element={<BecomeHostPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
