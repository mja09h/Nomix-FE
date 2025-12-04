export interface User {
    _id: string;
    username: string;
    email: string;
    name?: string;
    profilePicture?: string;
    image?: string; // Alternative field for profile picture
    bio?: string;
    recipes?: string[]; // Array of ObjectIds
    favorites?: string[];
    followers?: string[];
    following?: string[];
    isActive?: boolean;
    isAdmin?: boolean;
    isBanned?: boolean;
    banExpiresAt?: Date | string | null;
    banReason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export default User;
