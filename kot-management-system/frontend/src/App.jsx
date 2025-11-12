// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './admin/pages/Login';
import Signup from './admin/pages/Signup';
import Dashboard from './admin/components/Dashboard';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;