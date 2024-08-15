import express from "express";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/index";

// Configure dotenv, specify the path to the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(router);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
