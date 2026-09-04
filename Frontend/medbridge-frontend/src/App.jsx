import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportShortage from './pages/ReportShortage';
import MatchSupply from './pages/MatchSupply';
import AboutUs from './pages/AboutUs';
import Analysis from './pages/Analysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report-shortage" element={<ReportShortage />} />
        <Route path="/match-supply" element={<MatchSupply />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </Router>
  );
}

export default App;
