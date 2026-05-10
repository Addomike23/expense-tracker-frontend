import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // Remove BrowserRouter/Router import
import Wrapper from "./components/Wrapper";
import DashboardHome from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Categories from "./components/Categories";
import Insights from "./components/Insights";
import ExportData from "./components/ExportData";
import AddTransaction from "./components/AddTransaction";
import Settings from "./components/Settings";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // NOT wrapped in <Router> - Router is in main.jsx
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Wrapper onLogout={handleLogout} user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/export" element={<ExportData />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit/:id" element={<AddTransaction />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Wrapper>
  );
}

export default App;