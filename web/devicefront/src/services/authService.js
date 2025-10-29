// authService.js
import axios from "axios";

const API_URL = "https://localhost:7003/api/auth";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  const token = response.data.token; // assuming { token: "JWT_HERE" }
  localStorage.setItem("jwtToken", token);
  return token;
};

export const getAuthHeader = () => {
  const token = localStorage.getItem("jwtToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const logout = () => {
  localStorage.removeItem("jwtToken");
};
