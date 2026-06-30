import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { initApi, getApiToken } from './src/services/api';
import { registerForPushNotificationsAsync } from './src/services/notifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TripsScreen from './src/screens/TripsScreen';
import PostsScreen from './src/screens/PostsScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        async function startup() {
            await initApi();
            const token = getApiToken();
            if (token) {
                setIsAuthenticated(true);
                // Register push notifications when app starts logged-in
                registerForPushNotificationsAsync();
            }
            setIsInitialized(true);
        }
        startup();
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setActiveTab('dashboard');
        // Register push notifications on successful login
        registerForPushNotificationsAsync();
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    const handleNavigate = (tabName) => {
        setActiveTab(tabName);
    };

    if (!isInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <Text style={styles.loadingLogo}>🇮🇹</Text>
                <Text style={styles.loadingText}>Týden v Itálii</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
                <StatusBar barStyle="dark-content" />
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Active Screen View */}
            <View style={styles.content}>
                {activeTab === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
                {activeTab === 'trips' && <TripsScreen />}
                {activeTab === 'posts' && <PostsScreen />}
                {activeTab === 'comments' && <CommentsScreen />}
                {activeTab === 'settings' && <SettingsScreen onLogout={handleLogout} />}
            </View>

            {/* Premium Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('dashboard')}
                >
                    <Text style={styles.tabIcon}>📊</Text>
                    <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Přehled</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'trips' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('trips')}
                >
                    <Text style={styles.tabIcon}>✈️</Text>
                    <Text style={[styles.tabLabel, activeTab === 'trips' && styles.tabLabelActive]}>Cesty</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('posts')}
                >
                    <Text style={styles.tabIcon}>✍️</Text>
                    <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>Články</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'comments' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('comments')}
                >
                    <Text style={styles.tabIcon}>💬</Text>
                    <Text style={[styles.tabLabel, activeTab === 'comments' && styles.tabLabelActive]}>Komentáře</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('settings')}
                >
                    <Text style={styles.tabIcon}>⚙️</Text>
                    <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Nastavení</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFBF7',
    },
    loadingLogo: {
        fontSize: 60,
        marginBottom: 10,
    },
    loadingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#112233',
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8E3D9',
        height: 65,
        paddingBottom: Platform.OS === 'ios' ? 15 : 5,
        paddingTop: 5,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabItemActive: {
        borderTopWidth: 2,
        borderTopColor: '#E05A36',
    },
    tabIcon: {
        fontSize: 20,
    },
    tabLabel: {
        fontSize: 10,
        color: '#8c7a6b',
        fontWeight: '600',
        marginTop: 4,
    },
    tabLabelActive: {
        color: '#E05A36',
        fontWeight: 'bold',
    },
});
