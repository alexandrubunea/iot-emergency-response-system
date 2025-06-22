import axios from "axios";
import { Request, Response, RequestHandler } from "express";

export async function fetchStats(_: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.get(`${API_HOST}/api/stats`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch data.",
        });
    }
}

export const fetchAlertsOverTime: RequestHandler<{ range: string }> = async (req, res) => {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined) {
            res.status(500).json({
                status: "error",
                message: "Server configuration error: API host not defined"
            });
            return;
        }

        if (API_KEY === undefined) {
            res.status(500).json({
                status: "error",
                message: "Server configuration error: API key not defined"
            });
            return;
        }

        const range = req.params.range;

        const response = await axios({
            method: 'get',
            url: `${API_HOST}/api/alerts_over_time`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            data: { range }
        });

        res.json(response.data);

    } catch (error) {
        console.error("Error fetching alerts data:", error);

        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status || 500;
            res.status(statusCode).json({
                status: "error",
                message: error.response?.data?.message || "Error communicating with alerts service"
            });
        } else {
            res.status(500).json({
                status: "error",
                message: "Internal server error while fetching alerts data"
            });
        }
    }
};
