import client from './index';
import { Category } from '../types/Category';

export const getAllCategories = async (): Promise<Category[]> => {
    try {
        const response = await client.get('/categories');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export const getCategoryById = async (id: string): Promise<Category> => {
    try {
        const response = await client.get(`/categories/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching category ${id}:`, error);
        throw error;
    }
};

export const createCategory = async (name: string): Promise<Category> => {
    try {
        const response = await client.post('/categories', { name });
        return response.data.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
    try {
        const response = await client.put(`/categories/${id}`, { name });
        return response.data.data;
    } catch (error) {
        console.error(`Error updating category ${id}:`, error);
        throw error;
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    try {
        await client.delete(`/categories/${id}`);
    } catch (error) {
        console.error(`Error deleting category ${id}:`, error);
        throw error;
    }
};

// Admin functions
export const getAllCategoriesAdmin = async (): Promise<{ data: Category[]; total: number }> => {
    try {
        const response = await client.get('/categories/admin/all');
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error('Error fetching all categories (admin):', error);
        throw error;
    }
};

export const adminDeleteCategory = async (categoryId: string): Promise<void> => {
    try {
        await client.delete(`/categories/admin/${categoryId}`);
    } catch (error) {
        console.error(`Error deleting category ${categoryId} (admin):`, error);
        throw error;
    }
};

export const getReportsForCategory = async (categoryId: string): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await client.get(`/categories/admin/${categoryId}/reports`);
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error(`Error fetching reports for category ${categoryId}:`, error);
        throw error;
    }
};
