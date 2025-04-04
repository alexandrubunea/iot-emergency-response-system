import axios from "axios";
import { Request, Response } from "express";
import { provideUniqueIdentifier } from "../utils/provideUniqueIdentifier.js";

export async function fetchAllBusinesses(_: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.get(`${API_HOST}/api/businesses`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        let businesses = provideUniqueIdentifier(response.data)["data"];
        businesses.forEach((business: any) => {
            business["devices"] = provideUniqueIdentifier(business["devices"]);
        });

        res.json(businesses);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch data.",
        });
    }
}

export async function addNewBusiness(req: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.post(`${API_HOST}/api/businesses`, req.body, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to post data.",
        });
    }
}

export async function deleteBusiness(req: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.delete(`${API_HOST}/api/businesses/${req.params.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to delete data.",
        });
    }
}

export async function getAlerts(_: Request, res: Response) {
    const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
    const API_HOST = process.env.COMMUNICATION_NODE_HOST;

    try {
        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.get(`${API_HOST}/api/alerts`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        let alerts = provideUniqueIdentifier(response.data)["data"];
        res.json(alerts);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch data.",
        });
    }
}
