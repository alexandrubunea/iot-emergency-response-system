import { Business } from "../models/Business";
import { Device } from "../models/Device";

export function createDevicesFromJson(data:any[]): Array<Device> {
    let result: Array<Device> = [];

    data.forEach(device => {
        result.push(new Device(
            device["id"],
            device["_id"],
            device["name"],
            device["motion_sensor"],
            device["sound_sensor"],
            device["fire_sensor"],
            device["gas_sensor"]
        ))
    });

    return result;
}

export function createBusinessesFromJson(data:any[]): Array<Business> {
    let result: Array<Business> = [];

    data.forEach(business => {
        result.push(new Business(
            business["id"],
            business["_id"],
            business["name"],
            business["address"],
            business["lat"],
            business["lon"],
            createDevicesFromJson(business["devices"]),
            business["alert"],
            business["contact_name"],
            business["contact_phone"],
            business["contact_email"]
        ));
    });

    return result;
}
