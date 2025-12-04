import client from './index';
import { Ingredient } from '../types/Recipe';

export const getAllIngredients = async (): Promise<Ingredient[]> => {
    try {
        const response = await client.get('/ingredients');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        throw error;
    }
};

export const getIngredientById = async (id: string): Promise<Ingredient> => {
    try {
        const response = await client.get(`/ingredients/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching ingredient ${id}:`, error);
        throw error;
    }
};

export const createIngredient = async (name: string, quantity?: string): Promise<Ingredient> => {
    try {
        const response = await client.post('/ingredients', { name, quantity });
        return response.data.data;
    } catch (error) {
        console.error('Error creating ingredient:', error);
        throw error;
    }
};

export const updateIngredient = async (id: string, name: string, quantity?: string): Promise<Ingredient> => {
    try {
        const response = await client.put(`/ingredients/${id}`, { name, quantity });
        return response.data.data;
    } catch (error) {
        console.error(`Error updating ingredient ${id}:`, error);
        throw error;
    }
};

export const deleteIngredient = async (id: string): Promise<void> => {
    try {
        await client.delete(`/ingredients/${id}`);
    } catch (error) {
        console.error(`Error deleting ingredient ${id}:`, error);
        throw error;
    }
};

// Admin functions
export const getAllIngredientsAdmin = async (): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await client.get('/ingredients/admin/all');
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error('Error fetching all ingredients (admin):', error);
        throw error;
    }
};

export const adminDeleteIngredient = async (ingredientId: string): Promise<void> => {
    try {
        await client.delete(`/ingredients/admin/${ingredientId}`);
    } catch (error) {
        console.error(`Error deleting ingredient ${ingredientId} (admin):`, error);
        throw error;
    }
};

export const getReportsForIngredient = async (ingredientId: string): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await client.get(`/ingredients/admin/${ingredientId}/reports`);
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error(`Error fetching reports for ingredient ${ingredientId}:`, error);
        throw error;
    }
};
