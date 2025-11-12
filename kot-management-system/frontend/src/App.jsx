// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './admin/pages/Login';
import Signup from './admin/pages/Signup';
import Dashboard from './admin/components/Dashboard';
import EditFoodForm from './admin/components/EditFoodForm';
import AddFoodForm from './admin/components/AddFoodForm';
import FoodList from './admin/components/FoodList';




function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/food-menu" element={<FoodList />} />
      <Route path="/add-food" element={<AddFoodForm />} />
       <Route path="/edit-food/:id" element={<EditFoodForm />} />
    </Routes>
  );
}

export default App;