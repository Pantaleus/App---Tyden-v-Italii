import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiPost } from './api';

// Configures how notifications are displayed when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notifications!');
        return null;
    }

    try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);

        // Register on our PHP backend
        await apiPost('/api/register-push', { push_token: token });
    } catch (error) {
        console.log('Info: Push notifikace nejsou nakonfigurovány (chybí projectId v app.json pro Expo Go).');
    }

    return token;
}
