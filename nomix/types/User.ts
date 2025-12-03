export interface User {
    _id: string;
    username: string;
    email: string;
    name?: string;
    profilePicture?: string;
    bio?: string;
    recipes?: string[]; // Array of ObjectIds
    favorites?: string[];
    followers?: string[];
    following?: string[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export default User;
