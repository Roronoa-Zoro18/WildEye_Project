const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // <-- Import Mongoose
require('dotenv').config(); // <-- Import and configure dotenv

// Initialize the Express app
const app = express();
const PORT = 5000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Connect to MongoDB ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log("Successfully connected to MongoDB Atlas!");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

// === Define a Database Model ===
// This tells MongoDB what our alert data should look like
const sightingSchema = new mongoose.Schema({
    animal: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now // This will be set by the server
    }
    // We can add location, etc. here later
});

// "Sighting" is the name of our model. 
// MongoDB will automatically create a collection called "sightings" (plural)
const Sighting = mongoose.model('Sighting', sightingSchema);


// === Routes ===
app.get('/', (req, res) => {
    res.send('Wildeye Backend is running!');
});

app.post('/api/alert', async (req, res) => { // <-- Made this function 'async'
    console.log("-------------------------------------");
    console.log("!!! ALERT RECEIVED FROM PYTHON !!!");

    const { animal, timestamp } = req.body;
    
    console.log(`Animal Detected: ${animal}`);
    console.log(`Python Timestamp: ${new Date(timestamp * 1000).toLocaleString()}`); 

    // === NEW: Save to Database ===
    try {
        // Create a new sighting document based on our model
        const newSighting = new Sighting({
            animal: animal,
            timestamp: new Date(timestamp * 1000) // Use the timestamp from Python
        });

        // Save the document to the "sightings" collection in MongoDB
        const savedSighting = await newSighting.save();
        
        console.log("SUCCESS: Alert saved to database.");
        console.log(savedSighting);
        
        // TODO: Send this 'savedSighting' data to React via WebSockets

        // Send a success response back to the Python script
        res.status(200).json({
            message: "Alert received and saved successfully",
            data: savedSighting
        });

    } catch (error) {
        console.error("Error saving to database:", error);
        res.status(500).json({ message: "Error saving alert to database" });
    }
});

// === Start the Server ===
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Waiting for alerts from the Python script...");
});