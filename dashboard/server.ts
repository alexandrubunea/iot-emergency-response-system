import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

import { fileURLToPath } from "url";
import { fetchAllBusinesses, addNewBusiness, deleteBusiness } from "./routes/businessRoutes.js";
import { deleteDevice } from "./routes/deviceRoutes.js";
import { addEmployee, deleteEmployee, getEmployees } from "./routes/employeeRoutes.js";

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
app.delete("/api/businesses/:id", deleteBusiness);

app.delete("/api/devices/:id", deleteDevice);

app.get("/api/employees", getEmployees);
app.post("/api/employees", addEmployee);
app.delete("/api/employees/:id", deleteEmployee);

app.get("*", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
