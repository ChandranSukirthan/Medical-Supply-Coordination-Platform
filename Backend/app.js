const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const requestRoutes = require("./routes/requestRoutes");
const offerRoutes = require("./routes/offerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const transferRoutes = require("./routes/transferRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
  })
);
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stock", stockRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/transfers", transferRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
