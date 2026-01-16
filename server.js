import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import categoryRoutes from "./routes/category.routes.js";
import itemRoutes from "./routes/item.routes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// DB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/categories", categoryRoutes);

app.use("/api/items", itemRoutes);


// Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
