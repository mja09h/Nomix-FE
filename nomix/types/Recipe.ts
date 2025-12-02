export interface Recipe {
    _id?: string;
    id?: string;
    name: string;
    description: string;
    image?: string;
    rating?: number;
    tags?: string[];
    ingredients: string[];
    instructions: any;
    calories?: string;
    user?: string | { username: string; image?: string };
    category?: string | { name: string };
}

