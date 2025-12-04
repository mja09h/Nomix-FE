export interface Ingredient {
    _id: string;
    name: string;
    quantity?: string;
    Recipe?: string[]; // Recipes using this ingredient
}

export interface Category {
    _id: string;
    name: string;
    image?: string;
}

export interface Reply {
    _id: string;
    user: {
        _id: string;
        username: string;
        image?: string;
        profilePicture?: string;
    } | string;
    text: string;
    likes: string[]; // Array of user IDs who liked
    createdAt: string;
}

export interface Comment {
    _id: string;
    user: {
        _id: string;
        username: string;
        image?: string;
        profilePicture?: string;
    } | string;
    text: string;
    likes: string[]; // Array of user IDs who liked
    replies: Reply[];
    createdAt: string;
}

export interface Recipe {
    _id: string;
    name: string;
    description?: string;
    category: Category[] | string[]; // Can be populated or IDs
    ingredients: Ingredient[] | string[]; // Can be populated or IDs
    instructions: string[];
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    image?: string; // Legacy single image support
    images?: string[]; // Multiple images array
    userId?: { _id: string; username: string; image?: string; profilePicture?: string } | string;
    likes?: string[]; // Array of user IDs who liked
    comments?: Comment[];
    views?: number; // View count
    isPublic?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
