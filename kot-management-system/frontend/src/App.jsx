// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./admin/pages/Login";
import Signup from "./admin/pages/Signup";
import Dashboard from "./admin/components/Dashboard";
import MenuPage from "./users/components/MenuPage";
import OrderSuccess from "./users/components/OrderSuccess";
import PaymentPage from "./users/components/PaymentPage";

import EditFoodForm from "./admin/components/EditFoodForm";
import AddFoodForm from "./admin/components/AddFoodForm";
import FoodList from "./admin/components/FoodList";
import CashierPortal from "./cashier/components/CashierPortal";
import CashierWait from "./cashier/pages/CashierWait";
import PendingOrdersPage from "./cashier/components/PendingOrdersPage";
import CompletedOrdersPage from "./cashier/components/CompletedOrdersPage";

// ======================================================
// AUTH HELPERS
// ======================================================

const isAuthenticated = () => !!localStorage.getItem("access_token");

const getRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role || null;
  } catch {
    return null;
  }
};

// ======================================================
// PROTECTED ROUTE COMPONENT
// ======================================================

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = getRole();
  if (!allowedRoles.includes(role))
    return <Navigate to="/unauthorized" replace />;

  return children;
};

// ======================================================
// APP ROUTES
// ======================================================

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<h1>Unauthorized Access</h1>} />

      {/* ===================== ADMIN ONLY ====================== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/food-menu"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FoodList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-food"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AddFoodForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-food/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EditFoodForm />
          </ProtectedRoute>
        }
      />

      {/* =================== CASHIER + ADMIN =================== */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute allowedRoles={["cashier", "admin"]}>
            <CashierPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier-wait"
        element={
          <ProtectedRoute allowedRoles={["cashier", "admin", "waiter"]}>
            <CashierWait />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/pending-orders"
        element={
          <ProtectedRoute allowedRoles={["cashier", "admin"]}>
            <PendingOrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/completed-orders"
        element={
          <ProtectedRoute allowedRoles={["cashier", "admin"]}>
            <CompletedOrdersPage />
          </ProtectedRoute>
        }
      />

      {/* ======================= WAITER ONLY ======================= */}
      <Route
        path="/menu"
        element={
          <ProtectedRoute allowedRoles={["waiter"]}>
            <MenuPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute allowedRoles={["waiter"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/success"
        element={
          <ProtectedRoute allowedRoles={["waiter"]}>
            <OrderSuccess />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
