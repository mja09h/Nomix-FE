import client from ".";
import { removeToken, setToken } from "./storage";

const login = async (identifier: string, password: string) => {
    try {
        const response = await client.post("/auth/login", {
            identifier,
            password,
        });

        await setToken(response.data.token);
        return { success: true, data: response.data };

    } catch (error: any) {
        console.error("Login error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const register = async (
    username: string,
    email: string,
    password: string
) => {
    try {
        const response = await client.post("/auth/", {
            username,
            email,
            password,
        });

        await setToken(response.data.token);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Registration error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
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

const getAllUsers = async () => {
    try {
        const response = await client.get("/auth/")
        return response.data;

    } catch (error) {
        console.error("Get all users error", error);

        return null;
    }
};

const updateUser = async (id: string, data: any) => {
    try {
        const response = await client.put(`/auth/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Update user error", error);
        return null;
    }
};

const deleteUser = async (identifier: string, password: string) => {
    try {
        const response = await client.delete(`/auth/`,
            {
                data: {
                    identifier,
                    password,
                },
            }
        );
        return response.data;

    } catch (error) {
        console.error("Delete user error", error);
        return null;
    }
};

const getUserById = async (id: string) => {
    try {
        const response = await client.get(`/auth/${id}`);
        return response.data;
    } catch (error) {
        console.error("Get user by id error", error);
        return null;
    }
};

export { login, register, logout, getAllUsers, updateUser, deleteUser, getUserById };