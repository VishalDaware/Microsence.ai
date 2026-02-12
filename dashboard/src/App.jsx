import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Import your pages
import Dashboard from "./pages/Dashboard";
import ContactPage from "./pages/ContactPage";
import ReportsPage from "./pages/ReportsPage";
import ChartsPage from "./pages/ChartsPage";
import TablesPage from "./pages/TablesPage";
import FieldsPage from "./pages/FieldsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

// Protected Route Component
function ProtectedRoute({ children, isLoggedIn }) {
  return isLoggedIn ? children : <Navigate to="/login" />;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check auth status whenever localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    const handleUserLoggedIn = () => {
      checkAuthStatus();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, []);

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <Router>
      {isLoggedIn ? (
        // Authenticated Layout
        <div className="min-h-screen bg-slate-100">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:ml-64">
            <div className="sticky top-0 z-20 bg-slate-100/80 backdrop-blur">
              <Topbar 
                onToggleSidebar={() => setSidebarOpen((s) => !s)}
                user={user}
                onLogout={handleLogout}
              />
            </div>
            <main className="min-h-[calc(100vh-56px)] overflow-y-auto">
              <div className="p-4">
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/fields" element={<FieldsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/charts" element={<ChartsPage />} />
                  <Route path="/tables" element={<TablesPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      ) : (
        // Unauthenticated Layout (Auth Pages)
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}
