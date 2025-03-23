import { Device } from "../models/Device"

export type IBusiness = {
    id: number,
    key: string,

    name: string,

    address: string,
    lat: number,
    lon: number,

    contactName: string | null,
    contactPhone: string | null,
    contactEmail: string | null,

    devices: Array<Device>,

    alert: boolean,
}
