require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB (native driver)
const client = new MongoClient(process.env.MONGO_URI);
let messagesCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("artist_portfolio");
  messagesCollection = db.collection("messages");
  console.log("MongoDB connected");
}

connectDB().catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend connected successfully" });
});

// Contact form
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await messagesCollection.insertOne({
      name,
      email,
      message,
      createdAt: new Date(),
    });

    console.log("New contact message:", { name, email });

    res.status(201).json({
      success: true,
      message: "Message received successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});


// Admin – get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await messagesCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await client.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});