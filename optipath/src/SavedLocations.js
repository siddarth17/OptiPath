import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SavedLocations.css';

const SavedLocations = () => {
  const navigate = useNavigate();
  const [savedPaths, setSavedPaths] = useState([]);

  useEffect(() => {
    const fetchSavedPaths = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://18.144.66.232:3001/saved-paths', {
          headers: { 'Authorization': token }
        });
        setSavedPaths(response.data);
      } catch (error) {
        console.error('Failed to fetch saved paths:', error);
      }
    };

    fetchSavedPaths();
  }, []);

  const handlePathClick = (path) => {
    navigate('/home', { state: path });
  };

  return (
    <div className="saved-locations-container">
      <h2>Saved Paths</h2>
      {savedPaths.length === 0 ? (
        <p>No saved paths yet.</p>
      ) : (
        <ul className="saved-paths-list">
          {savedPaths.map((path, index) => (
            <li key={index} onClick={() => handlePathClick(path)}>
              {path.locations.join(' → ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedLocations;