import client from "./client";
import { removeToken, setToken } from "./storage";

const login = async (username: string, password: string) => {
    try {
        const response = await client.post("/auth/login", {
            username,
            password,
        });

        await setToken(response.data.token);
        return { success: true };
    } catch (error) {
        console.error("Login error", error);
        return { success: false, error: (error as Error).message };
    }
};

const register = async (
    username: string,
    email: string,
    password: string
) => {
    try {
        const response = await client.post("/auth/register", {
            username,
            email,
            password,
        });

        await setToken(response.data.token);
        return { success: true };
    } catch (error) {
        console.error("Registration error", error);
        return { success: false, error: (error as Error).message };
    }
};

const logout = async () => {
    try {
        await removeToken();
        return { success: true };
    } catch (error) {
        console.error("Logout error", error);
        return { success: false, error: (error as Error).message };
    }
};

export { login, register, logout };