import { Device } from "../models/Device"

export type IBusiness = {
    name: string,

    address: string,
    lat: number,
    lon: number,

    devices: Array<Device>,

    alert: boolean,
}
