import axios from 'axios';
import { getToken } from './storage';

// REPLACE THIS WITH YOUR ACTUAL BACKEND URL
// If testing on Android Emulator use 'http://10.0.2.2:3000'
// If testing on physical device use your machine's IP 'http://192.168.1.X:3000'
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;

