import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = 'nomix_notifications_enabled';

export const getNotificationsEnabled = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        return value === null ? true : JSON.parse(value); // Default to true
    } catch (e) {
        return true;
    }
};

export const setNotificationsEnabledPref = async (enabled: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
    } catch (e) {
        console.error(e);
    }
};

