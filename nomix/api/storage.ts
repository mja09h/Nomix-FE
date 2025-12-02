import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'nomix_auth_token';

const getToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error getting token', error);
        return null;
    }
};

const setToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error setting token', error);
    }
};

const removeToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing token', error);
    }
};



export { getToken, setToken, removeToken };