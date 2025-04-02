import { Business } from "../models/Business";
import { Device } from "../models/Device";
import { Employee } from "../types/Employee";

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

export function createEmployeesFromJson(data: any[]): Array<Employee> {
    let result: Array<Employee> = [];

    data.forEach(employee => {
        let employeeObj = {
            id: employee["id"],
            first_name: employee["first_name"],
            last_name: employee["last_name"],
            phone: employee["phone"],
            email: employee["email"],
            api_key: employee["api_key"],
            created_at: employee["created_at"]
        }
        result.push(employeeObj);
    });

    return result;
}

export function createAlertsFromJson(data: any[]): Array<any> {
    let result: Array<any> = [];
    data.forEach(alert => {
        let alertObj = {
            _id: alert["_id"],
            id: alert["id"],
            device_id: alert["device_id"],
            device_name: alert["device_name"],
            alert_time: alert["alert_time"],
            alert_type: alert["alert_type"],
            business_name: alert["business_name"],
            message: alert["message"],
            resolved: alert["resolved"]
        }
        result.push(alertObj);
    });

    return result;
}
