import { Ipaddress } from "@/constants/ip";
import axios from "axios";

export const api = axios.create({
  baseURL: `${Ipaddress}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});
