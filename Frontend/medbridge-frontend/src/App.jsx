import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ReportShortage from './pages/ReportShortage.jsx';
import MatchSupply from './pages/MatchSupply.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Analysis from './pages/Analysis.jsx';

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
