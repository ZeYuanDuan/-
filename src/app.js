const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const routes = require("./src/routes");
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
