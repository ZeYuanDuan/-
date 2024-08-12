const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const router = require("./src/routes");
app.use(router);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
