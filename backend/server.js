const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// --- HTTP and Socket.io Imports ---
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
// -------------------

const app = express();
const PORT = 5000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// Add headers to prevent caching of video frames
app.use((req, res, next) => {
  if (req.path === '/api/video-frame') {
    // Disable caching for video frames
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// === Connect to MongoDB ===
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("SUCCESS: Successfully connected to MongoDB Atlas!"))
    .catch((error) => console.error("ERROR: Could not connect to MongoDB:", error));

// === Database Models ===
const sightingSchema = new mongoose.Schema({
    animal: {
        type: String,
        required: true
    },
    // --- NEW FIELD ---
    status: {
        type: String,
        required: true
    },
    // -----------------
    timestamp: {
        type: Date,
        required: true
    }
});
const Sighting = mongoose.model('Sighting', sightingSchema);

// Forest Officer Schema
const forestOfficerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    enabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const ForestOfficer = mongoose.model('ForestOfficer', forestOfficerSchema);

// === Create HTTP Server and Socket.io Server ===
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// === Socket.io Connection Logic ===
io.on('connection', (socket) => {
    console.log(`Socket.io: A user connected with socket id ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Socket.io: User ${socket.id} disconnected`);
    });
});

// === Routes ===
app.get('/', (req, res) => {
    res.send('Wildeye Backend is running and connected to DB!');
});

// Route to get all sightings
app.get('/api/sightings', async (req, res) => {
    try {
        const sightings = await Sighting.find().sort({ timestamp: -1 });
        res.status(200).json(sightings);
    } catch (error) {
        console.error("Error fetching sightings:", error);
        res.status(500).json({ message: "Error fetching sightings from database" });
    }
});

// Route to get all forest officers
app.get('/api/officers', async (req, res) => {
    try {
        const officers = await ForestOfficer.find().sort({ createdAt: -1 });
        res.status(200).json(officers);
    } catch (error) {
        console.error("Error fetching forest officers:", error);
        res.status(500).json({ message: "Error fetching forest officers from database" });
    }
});

// Route to add a new forest officer
app.post('/api/officers', async (req, res) => {
    try {
        const { name, email, phone, enabled } = req.body;
        
        // Validate required fields
        if (!name || (!email && !phone)) {
            return res.status(400).json({ 
                message: "Name and at least one contact method (email or phone) are required" 
            });
        }
        
        const newOfficer = new ForestOfficer({
            name,
            email: email || '',
            phone: phone || '',
            enabled: enabled !== undefined ? enabled : true
        });
        
        const savedOfficer = await newOfficer.save();
        console.log("SUCCESS: Forest officer registered:", savedOfficer.name);
        res.status(201).json({
            message: "Forest officer registered successfully",
            data: savedOfficer
        });
    } catch (error) {
        console.error("Error registering forest officer:", error);
        res.status(500).json({ message: "Error registering forest officer" });
    }
});

// Route to update a forest officer
app.put('/api/officers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, enabled } = req.body;
        
        const updatedOfficer = await ForestOfficer.findByIdAndUpdate(
            id,
            { name, email, phone, enabled },
            { new: true, runValidators: true }
        );
        
        if (!updatedOfficer) {
            return res.status(404).json({ message: "Forest officer not found" });
        }
        
        console.log("SUCCESS: Forest officer updated:", updatedOfficer.name);
        res.status(200).json({
            message: "Forest officer updated successfully",
            data: updatedOfficer
        });
    } catch (error) {
        console.error("Error updating forest officer:", error);
        res.status(500).json({ message: "Error updating forest officer" });
    }
});

// Route to delete a forest officer
app.delete('/api/officers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedOfficer = await ForestOfficer.findByIdAndDelete(id);
        
        if (!deletedOfficer) {
            return res.status(404).json({ message: "Forest officer not found" });
        }
        
        console.log("SUCCESS: Forest officer deleted:", deletedOfficer.name);
        res.status(200).json({
            message: "Forest officer deleted successfully",
            data: deletedOfficer
        });
    } catch (error) {
        console.error("Error deleting forest officer:", error);
        res.status(500).json({ message: "Error deleting forest officer" });
    }
});

app.post('/api/alert', async (req, res) => {
    console.log("-------------------------------------");
    console.log("!!! ALERT RECEIVED FROM PYTHON !!!");

    // --- NEW: Receive 'status' from the request body ---
    const { animal, timestamp, status } = req.body;
    console.log(`Animal: ${animal}, Status: ${status}`);
    
    try {
        const newSighting = new Sighting({
            animal: animal,
            status: status, // --- NEW: Save the status to DB
            timestamp: new Date(timestamp * 1000)
        });

        const savedSighting = await newSighting.save();
        
        console.log("SUCCESS: Alert saved to database.");

        // Broadcast the new alert (now containing status)
        io.emit('new-alert', savedSighting);
        
        // Send notifications to registered forest officers
        await sendNotificationsToOfficers(savedSighting);
        
        res.status(200).json({
            message: "Alert received, saved, and broadcasted",
            data: savedSighting
        });

    } catch (error) {
        console.error("Error saving to database:", error);
        res.status(500).json({ message: "Error saving alert to database" });
    }
});

// Function to send notifications to forest officers
async function sendNotificationsToOfficers(sighting) {
    try {
        // Get all enabled forest officers
        const officers = await ForestOfficer.find({ enabled: true });
        
        if (officers.length === 0) {
            console.log("No registered forest officers found for notifications");
            return;
        }
        
        console.log(`Sending notifications to ${officers.length} forest officers...`);
        
        // Create a transporter object using the default SMTP transport
        // Note: In production, you would use environment variables for these credentials
        
        // Check if email credentials are provided
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("WARNING: Email credentials not provided. Skipping email notifications.");
            console.log("To enable email notifications, set EMAIL_USER and EMAIL_PASS in .env file");
            return;
        }
        
        console.log(`Attempting to send email using credentials for: ${process.env.EMAIL_USER}`);
        
        let transporter = nodemailer.createTransport({
            service: 'gmail', // You can use other services like SendGrid, Outlook, etc.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        // Verify transporter configuration
        transporter.verify(function(error, success) {
            if (error) {
                console.error('SMTP Transporter verification failed:', error);
            } else {
                console.log('SMTP Transporter is ready to send emails');
            }
        });
        
        // Send email notifications
        for (const officer of officers) {
            if (officer.email) {
                try {
                    // Define email options
                    let mailOptions = {
                        from: process.env.EMAIL_USER || 'your_email@gmail.com',
                        to: officer.email,
                        subject: `Wildlife Alert: ${sighting.animal} Detected`,
                        text: `Attention Forest Officer ${officer.name},

An animal has been detected by the Wildeye system:

Animal: ${sighting.animal}
Conservation Status: ${sighting.status}
Time: ${sighting.timestamp}

Please take appropriate action.

Best regards,
Wildeye Wildlife Monitoring System`
                    };
                    
                    console.log(`Attempting to send email to: ${officer.email}`);
                    // Send the email
                    const info = await transporter.sendMail(mailOptions);
                    console.log(`EMAIL SENT SUCCESSFULLY: Alert sent to ${officer.name} (${officer.email}) - ${sighting.animal} detected (${sighting.status})`);
                    console.log(`Message ID: ${info.messageId}`);
                } catch (emailError) {
                    console.error(`EMAIL FAILED: Could not send alert to ${officer.name} (${officer.email}):`, emailError);
                }
            }
            

        }
        
        console.log("All notifications processed");
    } catch (error) {
        console.error("Error sending notifications to forest officers:", error);
    }
}

// Route to serve the latest video frame
app.get('/api/video-frame', (req, res) => {
    const framePath = path.join(__dirname, 'latest_frame.jpg');
    
    // Check if the frame file exists
    if (fs.existsSync(framePath)) {
        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Content-Type', 'image/jpeg');
        
        res.sendFile(framePath, (err) => {
            if (err) {
                console.error("Error sending video frame:", err);
                res.status(500).send('Error serving video frame');
            }
        });
    } else {
        // If no frame is available, send a placeholder
        console.log("No video frame available");
        res.status(404).send('No video frame available');
    }
});

// === Start the Server ===
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Waiting for alerts from the Python script...");
});