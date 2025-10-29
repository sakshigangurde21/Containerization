import axios from "axios";

const API_URL = "https://localhost:7003/api/Device";

// Use 'withCredentials: true' so cookies are sent automatically
export const getDevices = () => axios.get(API_URL, { withCredentials: true });
export const addDevice = (device) => axios.post(API_URL, device, { withCredentials: true });
export const updateDevice = (id, device) => axios.put(`${API_URL}/${id}`, device, { withCredentials: true });
export const deleteDevice = (id) => axios.delete(`${API_URL}/${id}`, { withCredentials: true });
