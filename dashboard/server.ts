import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { Server, Socket } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";

import { fileURLToPath } from "url";
import {
    fetchAllBusinesses,
    addNewBusiness,
    deleteBusiness,
    getAlerts,
} from "./routes/businessRoutes.js";
import { deleteDevice, solveAlert } from "./routes/deviceRoutes.js";
import {
    addEmployee,
    deleteEmployee,
    getEmployees,
} from "./routes/employeeRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());
app.use(cors());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.EXPRESS_VITE_API_URL,
        methods: ["GET", "POST"],
    },
});

// WebSocket Middleware
io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    const origin = socket.handshake.headers.origin;

    if (
        origin !== process.env.EXPRESS_VITE_API_URL &&
        origin !== process.env.COMMUNICATION_NODE_HOST &&
        origin !== process.env.VITE_EXPRESS_API_URL
    ) {
        console.log("Origin error: ", origin);
        return next(new Error("Origin error"));
    }

    if (
        origin === process.env.COMMUNICATION_NODE_HOST &&
        token !== process.env.EXPRESS_SOCKET_SECRET_KEY
    ) {
        console.log("Authentication error: ", token);
        return next(new Error("Authentication error"));
    }

    next();
});

// WebSocket Connection
io.on("connection", (socket: Socket) => {
    console.log("New client connected: ", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected: ", socket.id);
    });

    socket.on("new-alert", (alertData) => {
        alertData._id = uuidv4();
        console.log("Received new alert from Flask:", alertData);
        io.emit("update-alerts", alertData);
    });
});

// GET ROUTES
app.get("/api/businesses", fetchAllBusinesses);
app.post("/api/businesses", addNewBusiness);
app.delete("/api/businesses/:id", deleteBusiness);

app.delete("/api/devices/:id", deleteDevice);

app.get("/api/employees", getEmployees);
app.post("/api/employees", addEmployee);
app.delete("/api/employees/:id", deleteEmployee);

app.get("/api/alerts", getAlerts);
app.post("/api/solve_alert/:id", solveAlert);

app.get("*", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
