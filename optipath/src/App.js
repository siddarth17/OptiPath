// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import TSPSolver from './TSPSolver';
import LoginSignUp from './Login';
import SavedLocations from './SavedLocations';
import TravelInfo from './TravelInfo';
import './index.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [savedPaths, setSavedPaths] = useState([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = (navigate) => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/home');
  };

  const handleSavePath = (path) => {
    setSavedPaths([...savedPaths, path]);
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>OptiPath</h1>
          <nav>
            <ul>
              <li>
                <Link to="/home">Home</Link>
              </li>
              <li>
                <Link to="/travel-mail">Travel Safety</Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li>
                    <Link to="/saved-locations">Saved Locations</Link>
                  </li>
                  <li>
                    <LogoutButton onLogout={handleLogout} />
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login">Login</Link>
                </li>
              )}
            </ul>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<TSPSolver isLoggedIn={isLoggedIn} onSavePath={handleSavePath} />} />
          <Route path="/home" element={<TSPSolver isLoggedIn={isLoggedIn} onSavePath={handleSavePath} />} />
          <Route
            path="/login"
            element={<LoginSignUp onLogin={handleLogin} />}
          />
          <Route path="/saved-locations" element={<SavedLocations savedPaths={savedPaths} />} />
          <Route path="/travel-mail" element={<TravelInfo />} />
        </Routes>
      </div>
    </Router>
  );
};

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onLogout(navigate);
  };

  return <button onClick={handleClick}>Logout</button>;
};

export default App;