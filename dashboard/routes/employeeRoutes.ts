import axios from "axios";
import { Request, Response } from "express";

export async function addEmployee(req: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.post(
            `${API_HOST}/api/employees`,
            req.body,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to add employee.",
        });
    }
}

export async function getEmployees(_: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.get(`${API_HOST}/api/employees`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        res.json(response.data["data"]);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to get employees.",
        });
    }
}

export async function deleteEmployee(req: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.delete(
            `${API_HOST}/api/employees/${req.params.id}`,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to delete employee.",
        });
    }
}
