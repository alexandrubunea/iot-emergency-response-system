import axios from "axios";
import {Request, Response} from "express";
import { provideUniqueIdentifier } from "../utils/provideUniqueIdentifier.js";

export async function fetchAllBusinesses(_: Request, res: Response) {
    try {
        const API_KEY = process.env.COMMUNICATION_NODE_API_KEY;
        const API_HOST = process.env.COMMUNICATION_NODE_HOST;

        if (API_HOST === undefined)
            throw Error("COMMUNICATION_NODE_HOST not defined in .env file.");
        if (API_KEY === undefined)
            throw Error("COMMUNICATION_NODE_API_KEY not defined in .env file.");

        const response = await axios.get(`${API_HOST}/api/fetchAllBusinesses`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        });

        let businesses = provideUniqueIdentifier(response.data);
        businesses.forEach((business:any) => {
            business["devices"] = provideUniqueIdentifier(business["devices"])

            // Temporary, until further implementation
            business["alert"] = false;
        });

        res.json(businesses);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: 'Failed to fetch data.'
        });
    }
}
