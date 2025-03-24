const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json()); // Middleware to parse JSON requests
app.use(cors()); // Enable CORS

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));



// Sample User Model
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
});
const User = mongoose.model("User", UserSchema);

// Routes
app.get("/api/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.post("/api/users", async (req, res) => {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "User added!" });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
