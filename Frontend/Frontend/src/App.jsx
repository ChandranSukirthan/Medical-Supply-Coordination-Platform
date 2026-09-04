import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import './App.css';

// A simple dashboard placeholder component
const DashboardPlaceholder = () => (
  <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h1 style={{ color: '#1f2937' }}>Dashboard</h1>
    <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '2rem' }}>
      Welcome to the Medical Supply Coordination Platform!
    </p>
    <button onClick={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('hospitalInfo');
      window.location.href = '/login';
    }} style={{ 
      padding: '0.75rem 1.5rem', 
      cursor: 'pointer',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '1rem'
    }}>
      Logout
    </button>
  </div>
);

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardPlaceholder /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
