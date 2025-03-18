import { Device } from "../models/Device"

export type IBusiness = {
    id: number,
    key: string,

    name: string,

    address: string,
    lat: number,
    lon: number,

    devices: Array<Device>,

    alert: boolean,
}
