const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 5000;

const startServer = async () => {
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET is not configured");
	}

	await connectDB();

	app.listen(port, () => {
		console.log(`MedBridge LK backend running on port ${port}`);
	});
};

startServer().catch((error) => {
	console.error("Failed to start backend:", error.message);
	process.exit(1);
});
