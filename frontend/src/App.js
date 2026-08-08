import React from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Trucks from "@/pages/Trucks";
import Drivers from "@/pages/Drivers";
import Trips from "@/pages/Trips";
import Fuel from "@/pages/Fuel";
import Maintenance from "@/pages/Maintenance";
import Contracts from "@/pages/Contracts";
import Staff from "@/pages/Staff";
import Fastag from "@/pages/Fastag";
import Accounting from "@/pages/Accounting";
import Compliance from "@/pages/Compliance";
import Invoices from "@/pages/Invoices";
import Customers from "@/pages/Customers";
import AIInsights from "@/pages/AIInsights";
import Settings from "@/pages/Settings";
import PublicTracking from "@/pages/PublicTracking";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  React.useEffect(() => {
    if (localStorage.getItem("yfa_theme") !== "light") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/track/:lr" element={<PublicTracking />} />
          <Route path="/app" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="trips" element={<Trips />} />
            <Route path="fuel" element={<Fuel />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="staff" element={<Staff />} />
            <Route path="fastag" element={<Fastag />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="customers" element={<Customers />} />
            <Route path="insights" element={<AIInsights />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
