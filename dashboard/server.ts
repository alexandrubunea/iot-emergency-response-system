import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

import { fileURLToPath } from "url";
import { fetchAllBusinesses, addNewBusiness } from "./routes/businessRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(express.static(path.join(__dirname, "dist")));

app.use(express.json());

app.use(cors());

// GET ROUTES
app.get("/api/businesses", fetchAllBusinesses);
app.post("/api/businesses", addNewBusiness);

app.get("*", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
