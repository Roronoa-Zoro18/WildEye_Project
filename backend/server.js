const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// --- NEW IMPORTS ---
// We need the built-in 'http' module to create a server
const http = require('http');
// Import the Server class from socket.io
const { Server } = require("socket.io");
// -------------------

const app = express();
const PORT = 5000;

// === Middleware ===
app.use(cors()); // This is for Express (API routes)
app.use(express.json());

// === Connect to MongoDB ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("SUCCESS: Successfully connected to MongoDB Atlas!"))
    .catch((error) => console.error("ERROR: Could not connect to MongoDB:", error));

// === Database Model (no changes) ===
const sightingSchema = new mongoose.Schema({
    animal: { type: String, required: true },
    timestamp: { type: Date, required: true }
});
const Sighting = mongoose.model('Sighting', sightingSchema);

// === NEW: Create HTTP Server and Socket.io Server ===
// We create an HTTP server using our Express app
const httpServer = http.createServer(app);

// We initialize a new socket.io server and attach it to the http server
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins (for development)
        methods: ["GET", "POST"]
    }
});

// === NEW: Socket.io Connection Logic ===
// This runs every time a React app connects to our server
io.on('connection', (socket) => {
    console.log(`Socket.io: A user connected with socket id ${socket.id}`);

    // This runs when that specific user disconnects
    socket.on('disconnect', () => {
        console.log(`Socket.io: User ${socket.id} disconnected`);
    });
});
// ------------------------------------------

// === Routes (Almost the same) ===
app.get('/', (req, res) => {
    res.send('Wildeye Backend is running and connected to DB!');
});

app.post('/api/alert', async (req, res) => {
    console.log("-------------------------------------");
    console.log("!!! ALERT RECEIVED FROM PYTHON !!!");

    const { animal, timestamp } = req.body;
    console.log(`Animal Detected: ${animal}`);
    
    try {
        const newSighting = new Sighting({
            animal: animal,
            timestamp: new Date(timestamp * 1000)
        });

        const savedSighting = await newSighting.save();
        
        console.log("SUCCESS: Alert saved to database.");

        // === !!! THE MOST IMPORTANT NEW LINE !!! ===
        // This broadcasts the new alert to ALL connected React apps
        io.emit('new-alert', savedSighting);
        // ------------------------------------------
        
        res.status(200).json({
            message: "Alert received, saved, and broadcasted",
            data: savedSighting
        });

    } catch (error) {
        console.error("Error saving to database:", error);
        res.status(500).json({ message: "Error saving alert to database" });
    }
});

// === NEW: Start the Server ===
// We now start the 'httpServer' instead of the 'app'
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Waiting for alerts from the Python script...");
});