# OptiPath

## Overview
OptiPath is a full-stack web application designed to solve the Traveling Salesman Problem (TSP) while also incorporating machine learning to detect suspicious travel informtion. This app offers an intuitive interface for users to plan optimal routes and ensures travel safety through advanced analytics.

## Features
- **TSP Solver**: Implements an efficient recursive dynamic programming algorithm to find the optimal route between multiple locations.
- **Interactive Map Interface**: Utilizes Google Maps API for visual representation of routes and locations.
- **User Authentication**: Secure login and registration system with JWT-based authentication.
- **Route Saving**: Allows users to save and retrieve their optimized routes.
- **Suspicious Travel Detection**: Employs a machine learning model to analyze and flag potentially suspicious travel information.
- **Responsive Design**: Fully responsive web design for seamless use across devices.

## Tech Stack
### Frontend
- **React.js**: For building the user interface
- **React Router**: For handling navigation within the app
- **Axios**: For making HTTP requests to the backend
- **Google Maps API**: For map rendering, geocoding, and distance calculations

### Backend
- **Node.js**: Runtime environment for the server
- **Express.js**: Web application framework for Node.js
- **MongoDB**: Database for storing user information and saved routes
- **Mongoose**: ODM library for MongoDB and Node.js
- **JSON Web Tokens (JWT)**: For secure authentication

### Machine Learning
- **TensorFlow.js**: For implementing and running the ML model
- **Natural Language Processing (NLP)**: Used for processing and analyzing travel information descriptions

## Key Functionalities
1. **Route Optimization**:
   - Input up to 20 locations
   - Calculates the shortest possible route visiting all locations
   - Visualizes the optimized route on an interactive map

2. **User Account Management**:
   - Secure registration and login
   - Password hashing for enhanced security

3. **Route Management**:
   - Save optimized routes to user accounts
   - View and reload previously saved routes

4. **Travel Safety Analysis**:
   - Analyzes input location descriptions and travel patterns
   - Flags potentially suspicious or unsafe travel information

5. **Geocoding and Reverse Geocoding**:
   - Converts addresses to coordinates and vice versa
   - Supports autocomplete for location input

## Machine Learning Model
The suspicious travel detection model uses a combination of Natural Language Processing (NLP) and a Random Forest classifier:

- **Data Preprocessing**: Utilizes TF-IDF vectorization and NLTK for tokenization of travel descriptions.
- **Model Architecture**: Employs a Random Forest classifier trained on a dataset of travel patterns.
- **Performance**: Achieved a 99.4% accuracy in detecting suspicious travel patterns on the test dataset.

<img width="1512" alt="Screenshot 2024-07-01 at 2 34 20 AM" src="https://github.com/siddarth17/OptiPath/assets/111927633/37669e2a-5aa4-411d-8aa3-f018fc22fb56">
<img width="1509" alt="Screenshot 2024-07-01 at 2 35 39 AM" src="https://github.com/siddarth17/OptiPath/assets/111927633/2a5619a4-ee71-48d3-8a2c-df01c113996e">
<img width="1508" alt="Screenshot 2024-07-01 at 2 34 35 AM" src="https://github.com/siddarth17/OptiPath/assets/111927633/c8a4c866-7679-4234-ace1-aabea9dff2dc">
<img width="1503" alt="Screenshot 2024-07-01 at 2 36 40 AM" src="https://github.com/siddarth17/OptiPath/assets/111927633/d03c8eb5-f5e8-4555-8fbc-93456e06185c">
