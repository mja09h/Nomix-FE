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
    name: string,
    email: string,
    password: string
) => {
    try {
        const response = await client.post("/auth/", {
            username,
            name,
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
        const response = await client.put(`/auth/${id}`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            transformRequest: (data, headers) => {
                return data; // Do not stringify FormData
            },
        });
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Update user error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
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

const changePassword = async (id: string, data: any) => {
    try {
        const response = await client.put(`/auth/${id}/change-password`, data);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Change password error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const toggleFavorite = async (recipeId: string) => {
    try {
        const response = await client.post(`/auth/favorites/${recipeId}`);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Toggle favorite error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const toggleFollow = async (userId: string) => {
    try {
        const response = await client.post(`/auth/follow/${userId}`);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Toggle follow error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

// Admin functions
const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
        const response = await client.put(`/auth/${userId}/active`, { isActive });
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Toggle user active error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
        const response = await client.put(`/auth/${userId}/admin`, { isAdmin });
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Toggle user admin error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const banUser = async (userId: string, duration: number, unit: "hours" | "days", reason?: string) => {
    try {
        const response = await client.post(`/auth/${userId}/ban`, { duration, unit, reason });
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Ban user error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const unbanUser = async (userId: string) => {
    try {
        const response = await client.post(`/auth/${userId}/unban`);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
        console.error("Unban user error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

const getReportsForUser = async (userId: string) => {
    try {
        const response = await client.get(`/auth/${userId}/reports`);
        return { success: true, data: response.data.data };
    } catch (error: any) {
        console.error("Get reports for user error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

// Admin endpoint to get all users with filters
const getAllUsersAdmin = async (status?: "active" | "inactive", banned?: boolean) => {
    try {
        const params: any = {};
        if (status) params.status = status;
        if (banned !== undefined) params.banned = banned.toString();

        const response = await client.get("/auth/admin/all", { params });
        return { success: true, data: response.data.data, total: response.data.total };
    } catch (error: any) {
        console.error("Get all users admin error", error);
        const errorMessage = error.response?.data?.message || (error as Error).message;
        return { success: false, error: errorMessage };
    }
};

export {
    login,
    register,
    logout,
    getAllUsers,
    getAllUsersAdmin,
    updateUser,
    deleteUser,
    getUserById,
    changePassword,
    toggleFavorite,
    toggleFollow,
    toggleUserActive,
    toggleUserAdmin,
    banUser,
    unbanUser,
    getReportsForUser
};