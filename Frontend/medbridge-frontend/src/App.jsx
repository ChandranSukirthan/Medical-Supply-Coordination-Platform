import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportShortage from './pages/ReportShortage';
import MatchSupply from './pages/MatchSupply';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report-shortage" element={<ReportShortage />} />
        <Route path="/match-supply" element={<MatchSupply />} />
      </Routes>
    </Router>
  );
}

export default App;