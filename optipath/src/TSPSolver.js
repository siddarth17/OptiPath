import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './TSPSolver.css';

const MAX_LOCATIONS = 20;

const TSPSolver = ({ isLoggedIn, onSavePath }) => {
    const [locations, setLocations] = useState(['', '']);
    const [validLocations, setValidLocations] = useState([false, false]);
    const [minCost, setMinCost] = useState(null);
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const autoCompleteRefs = useRef([]);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const polylineRef = useRef(null);
    const labelsRef = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [isSaved, setIsSaved] = useState(false);
  
    useEffect(() => {
      if (location.state && location.state.locations) {
        const { locations: savedLocations, minCost: savedMinCost, path: savedPath } = location.state;
        setLocations(savedLocations);
        setValidLocations(savedLocations.map(() => true));
        setMinCost(savedMinCost);
        setPath(savedPath);
      }
    }, [location.state]);

  useEffect(() => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAnEwfF0Id73eHfO5E4XzLcVgM4SDudxLk&libraries=places`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);

      return () => {
          document.body.removeChild(script);
      };
  }, []);

  const initializeMap = () => {
      if (!window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
      });

      mapRef.current.map = map;
  };

  useEffect(() => {
      if (!window.google || !mapRef.current || !mapRef.current.map) return;

      const map = mapRef.current.map;

      markersRef.current.forEach((marker) => {
          if (marker) {
              marker.setMap(null);
          }
      });
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();
      let hasValidLocations = false;

      locations.forEach((location, index) => {
          if (location.trim() !== '') {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ address: location }, (results, status) => {
                  if (status === 'OK' && results[0]) {
                      const marker = new window.google.maps.Marker({
                          map: map,
                          position: results[0].geometry.location,
                          title: `Location ${index + 1}`,
                      });
                      bounds.extend(marker.getPosition());
                      markersRef.current.push(marker);
                      hasValidLocations = true;

                      if (hasValidLocations) {
                          map.fitBounds(bounds);
                      }
                  }
              });
          }
      });

      if (!hasValidLocations) {
          // Reset map to world view if no valid locations
          map.setCenter({ lat: 0, lng: 0 });
          map.setZoom(2);
      }
    }, [locations]);

    useEffect(() => {
        if (!window.google || path.length === 0 || !mapRef.current || !mapRef.current.map) return;

        const map = mapRef.current.map;
    
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
        labelsRef.current.forEach((label) => {
          label.setMap(null);
        });
        labelsRef.current = [];

        if (path.length <= 0) return;
    
        const pathCoordinates = path.map((locationIndex) => {
            const location = locations[locationIndex];
            const geocoder = new window.google.maps.Geocoder();
            return new Promise((resolve) => {
            geocoder.geocode({ address: location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location);
                } else {
                resolve(null);
                }
            });
            });
        });
        
        Promise.all(pathCoordinates).then((coordinates) => {
            const filteredCoordinates = coordinates.filter((coord) => coord !== null);
        
            const pathPolyline = new window.google.maps.Polyline({
            path: filteredCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            });
            pathPolyline.setMap(map);
            polylineRef.current = pathPolyline;
        
            const bounds = new window.google.maps.LatLngBounds();
            filteredCoordinates.forEach((coord) => {
            bounds.extend(coord);
            });
            map.fitBounds(bounds);
        
            // Assume path and locations array indices align correctly.
            filteredCoordinates.forEach((coord, index) => {
            const locationIndex = path[index]; // Get the actual index from the path array
            const labelText = `${index + 1}`;
            if (!(index === path.length - 1 && path[0] === locationIndex)) { // Check if it's the last index and it matches the first path index
                const label = new window.google.maps.Marker({
                position: coord,
                map: map,
                label: {
                    text: labelText,
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                },
                });
                labelsRef.current.push(label);
            }
            });
        });
    }, [path, locations]);
       
    const handleLocationChange = (index, value, isValid = false) => {
      const newLocations = [...locations];
      newLocations[index] = value;
      setLocations(newLocations);
      const newValidLocations = [...validLocations];
      newValidLocations[index] = isValid;
      setValidLocations(newValidLocations);
    };
  
    const addLocation = () => {
      if (locations.length < MAX_LOCATIONS && validLocations.every(Boolean) && locations[locations.length - 1].trim() !== '') {
        setLocations([...locations, '']);
        setValidLocations([...validLocations, false]);  
      }
    };
  
    const removeLocation = (index) => {
        const newLocations = [...locations];
        newLocations.splice(index, 1);
        setLocations(newLocations);
      
        const newValidLocations = [...validLocations];
        newValidLocations.splice(index, 1);
        setValidLocations(newValidLocations);
      
        setError(null); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
      
        const validInputs = validLocations.every(Boolean);
        if (!validInputs) {
          setError('Please ensure all locations are selected from the dropdown suggestions.');
          setLoading(false);
          return;
        }
      
        setLoading(true);
        setError(null);
        setMinCost(null);
        setPath([]);
        setIsSaved(false);
      
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
        labelsRef.current.forEach((label) => {
          label.setMap(null);
        });
        labelsRef.current = [];
      
        try {
          const validLocations = locations.filter((location) => location.trim() !== '');
          const response = await axios.post('http://localhost:3001/solve-tsp', { locations: validLocations });
          if (response.data.minCost === -1) {
            setError(response.data.message || "Locations are too far apart and cannot be travelled by land.");
          } else {
            setMinCost(response.data.minCost);
            setPath(response.data.path);
          }
        } catch (error) {
          setError('Failed to solve TSP. Please try again.');
          console.error('Error solving TSP:', error);
        } finally {
          setLoading(false);
        }
    }; 

    const handleSelect = (address, index) => {
        const newLocations = [...locations];
        newLocations[index] = address;
        setLocations(newLocations);
    
        const newValidLocations = [...validLocations];
        newValidLocations[index] = true; // Set to true as the location is now validated
        setValidLocations(newValidLocations);
    };

    const handleSavePath = async () => {
        if (isLoggedIn) {
            try {
              const token = localStorage.getItem('token');
              await axios.post('http://localhost:3001/save-path', 
                { locations, minCost, path },
                { headers: { 'Authorization': token } }
              );
              setIsSaved(true);
            } catch (error) {
              console.error('Failed to save path:', error);
            }
        } else {
            navigate('/login');
        }
    };
      
    const initializeAutocomplete = (index) => {
        if (!window.google) return;
    
        const input = autoCompleteRefs.current[index];
        const autocomplete = new window.google.maps.places.Autocomplete(input, { types: ['geocode'] });
        autocomplete.setFields(['address_component', 'formatted_address']); // Optimize the fields to reduce cost
    
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
                handleSelect(place.formatted_address, index);
            } else {
                // Handle the case where the autocomplete does not return a valid address
                const newValidLocations = [...validLocations];
                newValidLocations[index] = false;
                setValidLocations(newValidLocations);
                alert('Please select a valid address from the dropdown.');
            }
        });
    };    
      
    useEffect(() => {
        // Initialize the autocomplete for each input when component mounts or updates
        locations.forEach((_, index) => initializeAutocomplete(index));
    });

    return (
      <div className="app-container">
        <div className="container">
          <div className="form-container">
            <h3>Locations</h3>
            <form onSubmit={handleSubmit} className="input-field">
              {locations.map((location, index) => (
                <div key={index} className="location-input">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => handleLocationChange(index, e.target.value)}
                    ref={(ref) => (autoCompleteRefs.current[index] = ref)}
                    onFocus={() => initializeAutocomplete(index)}
                    placeholder={`Location ${index + 1}`}
                    required
                  />
                  {index > 1 && (
                    <span
                      className="remove-location"
                      onClick={() => removeLocation(index)}
                    >
                      &times;
                    </span>
                  )}
                </div>
              ))}
              {locations.length < MAX_LOCATIONS && locations[locations.length - 1].trim() !== '' && (
                <div className="add-location" onClick={addLocation}>
                  Add Location +
                </div>
              )}
              <button type="submit" disabled={loading || locations.some((location) => location.trim() === '')} className="button solve-button">
                {loading ? 'Solving...' : 'Compute'}
              </button>
            </form>
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="map-container">
            {path.length > 0 && (
              <div className="output-container">
                <h3>Optimal Path:</h3>
                <p>{path.map((index) => locations[index]).join(' → ')}</p>
                <button
                    onClick={handleSavePath}
                    className="button save-path-button"
                    disabled={isSaved}
                    >
                    {isSaved ? 'Saved' : 'Save Path'}
                </button>
              </div>
            )}
            <div ref={mapRef} className={`map ${path.length > 0 ? 'map-small' : ''}`}></div>
          </div>
        </div>
      </div>
    );
};

export default TSPSolver;