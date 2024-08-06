require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

app.use(cors()); 
app.use(express.json());
app.use(bodyParser.json());

const GOOGLE_MAPS_API_KEY = 'AIzaSyAnEwfF0Id73eHfO5E4XzLcVgM4SDudxLk';

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/tsp_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin' 
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Path Schema
const pathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  locations: [String],
  minCost: Number,
  path: [Number],
});

const Path = mongoose.model('Path', pathSchema);

const corsOptions = {
    origin: 'http://18.144.66.232:3000',  
    optionsSuccessStatus: 200, 
    credentials: true,  
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
};
  
app.use(cors(corsOptions));
  

async function createDistanceMatrix(locations) {
    const MAX_LOCATIONS_PER_BATCH = 10; 
    let distanceMatrix = [];

    for (let i = 0; i < locations.length; i += MAX_LOCATIONS_PER_BATCH) {
        const batchOrigins = locations.slice(i, i + MAX_LOCATIONS_PER_BATCH);
        for (let j = 0; j < locations.length; j += MAX_LOCATIONS_PER_BATCH) {
            const batchDestinations = locations.slice(j, j + MAX_LOCATIONS_PER_BATCH);

            const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
                params: {
                    origins: batchOrigins.join('|'),
                    destinations: batchDestinations.join('|'),
                    key: GOOGLE_MAPS_API_KEY,
                },
            });

            if (response.data.status !== 'OK') {
                throw new Error(response.data.error_message || 'Failed to fetch distance matrix');
            }

            response.data.rows.forEach((row, idx) => {
                const globalOriginIndex = i + idx;
                if (!distanceMatrix[globalOriginIndex]) {
                    distanceMatrix[globalOriginIndex] = [];
                }
                row.elements.forEach((element, destIdx) => {
                    const globalDestIndex = j + destIdx;
                    if (element.status !== 'OK') {
                        console.error(`No valid route from ${batchOrigins[idx]} to ${batchDestinations[destIdx]}`);
                        distanceMatrix[globalOriginIndex][globalDestIndex] = Infinity; // Use Infinity to represent no valid route
                    } else {
                        distanceMatrix[globalOriginIndex][globalDestIndex] = element.distance.value;
                    }
                });
            });
        }
    }

    return distanceMatrix;
}

function tspSolver(distanceMatrix) {
    const n = distanceMatrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (distanceMatrix[i][j] === Infinity) {
                return { minCost: -1, path: [], message: "Some locations are too far apart and cannot be travelled with land transport." };
            }
        }
    }
    const allVisited = (1 << n) - 1;
    const memo = {};

    function visit(city, visited) {
        if (visited === allVisited) {
            return { cost: distanceMatrix[city][0], path: [0] };
        }

        const key = `${city},${visited}`;
        if (memo[key]) {
            return memo[key];
        }

        let minCost = Infinity;
        let bestPath = [];

        for (let nextCity = 0; nextCity < n; nextCity++) {
            if ((visited & (1 << nextCity)) === 0) {
                const { cost: nextCost, path } = visit(nextCity, visited | (1 << nextCity));
                const cost = distanceMatrix[city][nextCity] + nextCost;
                if (cost < minCost) {
                    minCost = cost;
                    bestPath = [nextCity, ...path];
                }
            }
        }

        memo[key] = { cost: minCost, path: bestPath };
        return memo[key];
    }

    const { cost: minCost, path } = visit(0, 1);
    return { minCost, path: [0, ...path] };
}

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
      req.userId = decoded.userId;
      next();
    });
};

app.post('/solve-tsp', async (req, res) => {
    const { locations } = req.body;
    if (!locations || locations.length === 0) {
      return res.status(400).send({ error: 'No locations provided or locations array is empty.' });
    }
  
    const filteredLocations = locations.filter(location => location.trim() !== '');
    if (filteredLocations.length < 2) {
      return res.status(400).send({ error: 'At least two valid locations are required.' });
    }
  
    try {
      const distanceMatrix = await createDistanceMatrix(filteredLocations);
      const { minCost, path, message } = tspSolver(distanceMatrix);
      if (minCost === -1) {
        return res.status(200).send({ minCost, path, message });
      }
      res.json({ minCost, path });
    } catch (error) {
      console.error('Internal Server Error:', error);
      res.status(500).send({ error: 'Failed to solve TSP due to an internal error: ' + error.message });
    }
});

app.post('/predict-info', async (req, res) => {
    try {
        const textInput = req.body.text;
        const response = await axios.post('http://127.0.0.1:5000/predict', {
            text: textInput
        });
        const { prediction, probability } = response.data;
        res.json({ prediction, probability });
    } catch (error) {
        console.error('Error processing email prediction:', error.response.status, error.response.data);
        res.status(error.response.status).json({ error: error.response.data.error, message: error.response.data.message });
    }
});

// User registration
app.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration failed:', error); // Ensure you log the error
      res.status(500).json({ error: 'Registration failed', message: error.message });
    }
});

  
  // User login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

  // Save path
app.post('/save-path', verifyToken, async (req, res) => {
    try {
      const { locations, minCost, path } = req.body;
      const newPath = new Path({ userId: req.userId, locations, minCost, path });
      await newPath.save();
      res.status(201).json({ message: 'Path saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save path' });
    }
});
  
// Get saved paths
app.get('/saved-paths', verifyToken, async (req, res) => {
    try {
        const paths = await Path.find({ userId: req.userId });
        res.json(paths);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve paths' });
    }
});
  
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});