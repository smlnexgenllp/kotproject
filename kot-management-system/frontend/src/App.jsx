// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './admin/pages/Login';
import Signup from './admin/pages/Signup';
import Dashboard from './admin/components/Dashboard';
import MenuPage from './users/components/MenuPage';
import OrderSuccess from './users/components/OrderSuccess';
import PaymentPage from './users/components/PaymentPage';

import EditFoodForm from './admin/components/EditFoodForm';
import AddFoodForm from './admin/components/AddFoodForm';
import FoodList from './admin/components/FoodList';
import CashierPortal from './cashier/components/CashierPortal';
import CashierWait from './cashier/pages/CashierWait';
import PendingOrdersPage from './cashier/components/PendingOrdersPage';
import CompletedOrdersPage from './cashier/components/CompletedOrdersPage';





function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/success" element={<OrderSuccess />} />
      <Route path="/food-menu" element={<FoodList />} />
      <Route path="/add-food" element={<AddFoodForm />} />
      <Route path="/edit-food/:id" element={<EditFoodForm />} />
      <Route path="/cashier" element={<CashierPortal />} />
      <Route path="/cashier-wait" element={<CashierWait />} />
      <Route path="/cashier/pending-orders" element={<PendingOrdersPage />} />
      <Route path="/cashier/completed-orders" element={<CompletedOrdersPage />} />
    </Routes>
  );
}

export default App;