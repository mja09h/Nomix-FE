export interface Ingredient {
    _id: string;
    name: string;
}

export interface Category {
    _id: string;
    name: string;
    image?: string;
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
    createdAt: string;
}

export interface Recipe {
    _id: string;
    name: string;
    category: Category[] | string[]; // Can be populated or IDs
    ingredients: Ingredient[] | string[]; // Can be populated or IDs
    instructions: string[];
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    image?: string;
    userId?: { _id: string; username: string } | string;
    likes?: string[]; // Array of user IDs who liked
    comments?: Comment[];
    views?: number; // View count
    createdAt?: string;
    updatedAt?: string;
}
