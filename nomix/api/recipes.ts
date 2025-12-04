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

        if (recipeData.description) {
            formData.append('description', recipeData.description);
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

        // Handle multiple images
        if (recipeData.images && Array.isArray(recipeData.images)) {
            recipeData.images.forEach((imageUri: string) => {
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('images', {
                    uri: imageUri,
                    name: filename,
                    type,
                } as any);
            });
        } else if (recipeData.image) {
            // Fallback for single image (legacy support)
            const filename = recipeData.image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('images', {
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

        if (recipeData.description !== undefined) {
            formData.append('description', recipeData.description || '');
        }

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

        // Handle multiple new images
        if (recipeData.newImages && Array.isArray(recipeData.newImages)) {
            recipeData.newImages.forEach((imageUri: string) => {
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('images', {
                    uri: imageUri,
                    name: filename,
                    type,
                } as any);
            });
        }

        // Flag to replace all images with new ones
        if (recipeData.replaceImages !== undefined) {
            formData.append('replaceImages', String(recipeData.replaceImages));
        }

        // Images to remove (URLs)
        if (recipeData.removeImages && Array.isArray(recipeData.removeImages)) {
            formData.append('removeImages', recipeData.removeImages.join(','));
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

export const toggleLikeComment = async (recipeId: string, commentId: string): Promise<{ recipe: Recipe; message: string }> => {
    try {
        const response = await client.post(`/recipes/${recipeId}/comments/${commentId}/like`);
        return {
            recipe: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        console.error(`Error toggling like for comment ${commentId}:`, error);
        throw error;
    }
};

export const addReplyToComment = async (recipeId: string, commentId: string, text: string): Promise<Recipe> => {
    try {
        const response = await client.post(`/recipes/${recipeId}/comments/${commentId}/replies`, { text });
        return response.data.data;
    } catch (error) {
        console.error(`Error adding reply to comment ${commentId}:`, error);
        throw error;
    }
};

export const toggleLikeReply = async (recipeId: string, commentId: string, replyId: string): Promise<{ recipe: Recipe; message: string }> => {
    try {
        const response = await client.post(`/recipes/${recipeId}/comments/${commentId}/replies/${replyId}/like`);
        return {
            recipe: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        console.error(`Error toggling like for reply ${replyId}:`, error);
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

export const getRandomRecipe = async (): Promise<Recipe> => {
    try {
        const response = await client.get('/recipes/random');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        throw error;
    }
};

export interface CategoryWithRecipe {
    category: {
        _id: string;
        name: string;
    };
    recipe: Recipe | null;
}

export const getRandomCategoriesWithRecipes = async (): Promise<CategoryWithRecipe[]> => {
    try {
        const response = await client.get('/categories/random-with-recipes');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching random categories with recipes:', error);
        throw error;
    }
};

// Image management functions
export const addImagesToRecipe = async (recipeId: string, imageUris: string[]): Promise<Recipe> => {
    try {
        const formData = new FormData();

        imageUris.forEach((imageUri) => {
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('images', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        });

        const response = await client.post(`/recipes/${recipeId}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    } catch (error) {
        console.error(`Error adding images to recipe ${recipeId}:`, error);
        throw error;
    }
};

export const removeImageFromRecipe = async (recipeId: string, imageUrl: string): Promise<Recipe> => {
    try {
        const response = await client.delete(`/recipes/${recipeId}/images`, {
            data: { imageUrl },
        });
        return response.data.data;
    } catch (error) {
        console.error(`Error removing image from recipe ${recipeId}:`, error);
        throw error;
    }
};

// Admin functions
export const getAllRecipesAdmin = async (isPublic?: boolean, userId?: string): Promise<{ data: Recipe[]; total: number }> => {
    try {
        const params: any = {};
        if (isPublic !== undefined) params.isPublic = isPublic.toString();
        if (userId) params.userId = userId;

        const response = await client.get('/recipes/admin/all', { params });
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error('Error fetching all recipes (admin):', error);
        throw error;
    }
};

export const adminDeleteRecipe = async (recipeId: string): Promise<void> => {
    try {
        await client.delete(`/recipes/admin/${recipeId}`);
    } catch (error) {
        console.error(`Error deleting recipe ${recipeId} (admin):`, error);
        throw error;
    }
};

export const getReportsForRecipe = async (recipeId: string): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await client.get(`/recipes/admin/${recipeId}/reports`);
        return { data: response.data.data, total: response.data.total };
    } catch (error) {
        console.error(`Error fetching reports for recipe ${recipeId}:`, error);
        throw error;
    }
};

