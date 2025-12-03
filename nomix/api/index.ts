import axios from 'axios';
import { getToken } from './storage';


export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('file://')) {
        return path;
    }

    // Fix absolute paths from Windows backend (e.g. C:\Users\...\uploads\file.jpg)
    let cleanPath = path.replace(/\\/g, '/');
    if (cleanPath.includes('uploads/')) {
        cleanPath = 'uploads/' + cleanPath.split('uploads/').pop();
    }

    const cleanBase = BASE_URL.replace(/\/+$/, '');
    // Remove any leading slash to avoid double slashes
    const finalPath = cleanPath.replace(/^\/+/, '');

    const url = `${cleanBase}/${finalPath}`;
    console.log('Generated Image URL:', url);
    return url;
};

const client = axios.create({
    baseURL: BASE_URL + '/api',
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

