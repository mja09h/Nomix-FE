export interface Category {
    _id: string;
    id?: string;
    name: string;
    image?: string; // Backend usually returns an image URL or path
    recipes?: string[] | { _id: string; name: string }[]; // Recipes in this category
}

