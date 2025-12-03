import client from './index';
import { Recipe } from '../types/Recipe';

export const getAllRecipes = async (): Promise<Recipe[]> => {
    try {
        const response = await client.get('/recipes');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching recipes:', error);
        throw error;
    }
};

export const getRecipeById = async (id: string): Promise<Recipe> => {
    try {
        const response = await client.get(`/recipes/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching recipe ${id}:`, error);
        throw error;
    }
};

export const getRecipesByCategory = async (categoryId: string): Promise<Recipe[]> => {
    try {
        const response = await client.get(`/recipes/category/${categoryId}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching recipes for category ${categoryId}:`, error);
        throw error;
    }
};

export const createRecipe = async (recipeData: any): Promise<Recipe> => {
    try {
        const formData = new FormData();

        formData.append('name', recipeData.name);

        if (recipeData.ingredients) {
            if (Array.isArray(recipeData.ingredients)) {
                // Just join by comma to send as a single string if that is what backend expects for parsing
                formData.append('ingredients', recipeData.ingredients.join(','));
            } else {
                formData.append('ingredients', recipeData.ingredients);
            }
        }

        if (recipeData.instructions) {
            if (Array.isArray(recipeData.instructions)) {
                formData.append('instructions', recipeData.instructions.join(','));
            } else {
                formData.append('instructions', recipeData.instructions);
            }
        }

        if (recipeData.category) {
            if (Array.isArray(recipeData.category)) {
                formData.append('category', recipeData.category.join(','));
            } else {
                formData.append('category', recipeData.category);
            }
        }

        if (recipeData.calories) formData.append('calories', String(recipeData.calories));
        if (recipeData.protein) formData.append('protein', String(recipeData.protein));
        if (recipeData.carbohydrates) formData.append('carbohydrates', String(recipeData.carbohydrates));
        if (recipeData.fat) formData.append('fat', String(recipeData.fat));

        if (recipeData.image) {
            const filename = recipeData.image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: recipeData.image,
                name: filename,
                type,
            } as any);
        }

        const response = await client.post('/recipes', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error creating recipe:', error);
        throw error;
    }
};

export const updateRecipe = async (id: string, recipeData: any): Promise<Recipe> => {
    try {
        const formData = new FormData();

        if (recipeData.name) formData.append('name', recipeData.name);

        if (recipeData.category) {
            if (Array.isArray(recipeData.category)) {
                formData.append('category', recipeData.category.join(','));
            } else {
                formData.append('category', recipeData.category);
            }
        }

        if (recipeData.ingredients) {
            if (Array.isArray(recipeData.ingredients)) {
                formData.append('ingredients', recipeData.ingredients.join(','));
            } else {
                formData.append('ingredients', recipeData.ingredients);
            }
        }

        if (recipeData.instructions) {
            if (Array.isArray(recipeData.instructions)) {
                formData.append('instructions', recipeData.instructions.join(','));
            } else {
                formData.append('instructions', recipeData.instructions);
            }
        }

        if (recipeData.calories) formData.append('calories', String(recipeData.calories));
        if (recipeData.protein) formData.append('protein', String(recipeData.protein));
        if (recipeData.carbohydrates) formData.append('carbohydrates', String(recipeData.carbohydrates));
        if (recipeData.fat) formData.append('fat', String(recipeData.fat));

        if (recipeData.image) {
            const filename = recipeData.image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: recipeData.image,
                name: filename,
                type,
            } as any);
        }

        const response = await client.put(`/recipes/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    } catch (error) {
        console.error(`Error updating recipe ${id}:`, error);
        throw error;
    }
};

export const deleteRecipe = async (id: string): Promise<void> => {
    try {
        await client.delete(`/recipes/${id}`);
    } catch (error) {
        console.error(`Error deleting recipe ${id}:`, error);
        throw error;
    }
};

// Social Features

export const toggleLikeRecipe = async (id: string): Promise<{ recipe: Recipe; message: string }> => {
    try {
        const response = await client.post(`/recipes/${id}/like`);
        return {
            recipe: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        console.error(`Error toggling like for recipe ${id}:`, error);
        throw error;
    }
};

export const addComment = async (id: string, text: string): Promise<Recipe> => {
    try {
        const response = await client.post(`/recipes/${id}/comments`, { text });
        return response.data.data;
    } catch (error) {
        console.error(`Error adding comment to recipe ${id}:`, error);
        throw error;
    }
};

export const deleteComment = async (recipeId: string, commentId: string): Promise<Recipe> => {
    try {
        const response = await client.delete(`/recipes/${recipeId}/comments/${commentId}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error deleting comment ${commentId} from recipe ${recipeId}:`, error);
        throw error;
    }
};

export const getLikedRecipes = async (): Promise<Recipe[]> => {
    try {
        const response = await client.get('/recipes');
        const allRecipes: Recipe[] = response.data.data;
        // Filter recipes where current user has liked
        // The filtering will be done on the component side since we need the user ID
        return allRecipes;
    } catch (error) {
        console.error('Error fetching liked recipes:', error);
        throw error;
    }
};

