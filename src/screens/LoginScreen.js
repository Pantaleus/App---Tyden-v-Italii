import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import QRScanner from '../components/QRScanner';
import { apiPost, setCredentials } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [serverUrl, setServerUrl] = useState('https://tyden-v-italii.eu');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const handleCredentialsLogin = async () => {
        if (!email || !password || !serverUrl) {
            setError('Vyplňte prosím všechna pole');
            return;
        }
        setError('');
        setLoading(true);
        try {
            // Setup temporary url in service to perform the check
            const formattedUrl = serverUrl.trim();
            const result = await apiPost('/api/login', { email, password }, formattedUrl);
            
            // Save settings permanently
            await setCredentials(formattedUrl, result.token);
            onLoginSuccess();
        } catch (e) {
            setError(e.message || 'Chyba při přihlášení. Zkontrolujte údaje.');
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = async (scannedUrl, scannedToken) => {
        setShowScanner(false);
        setLoading(true);
        setError('');
        try {
            // Setup credentials temporarily
            await setCredentials(scannedUrl, ''); 
            
            // Perform login with token to get standard session token
            const result = await apiPost('/api/qr-login', { qr_token: scannedToken });
            
            // Save permanently
            await setCredentials(scannedUrl, result.token);
            onLoginSuccess();
        } catch (e) {
            setError(e.message || 'Přihlášení přes QR kód selhalo.');
        } finally {
            setLoading(false);
        }
    };

    if (showScanner) {
        return (
            <QRScanner 
                onScan={handleQRScan} 
                onClose={() => setShowScanner(false)} 
            />
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.flagText}>🇮🇹</Text>
                    <Text style={styles.title}>Týden v Itálii</Text>
                    <Text style={styles.subtitle}>Administrační panel</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.form}>
                    <Text style={styles.label}>Adresa webového serveru</Text>
                    <TextInput 
                        style={styles.input}
                        value={serverUrl}
                        onChangeText={setServerUrl}
                        placeholder="https://tyden-v-italii.eu"
                        autoCapitalize="none"
                        keyboardType="url"
                    />

                    <Text style={styles.label}>E-mailová adresa</Text>
                    <TextInput 
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="admin@tyden-v-italii.eu"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Heslo</Text>
                    <TextInput 
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    {loading ? (
                        <ActivityIndicator size="large" color="#E05A36" style={styles.loader} />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.loginButton} onPress={handleCredentialsLogin}>
                                <Text style={styles.loginButtonText}>Přihlásit se</Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>NEBO</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.qrButton} onPress={() => setShowScanner(true)}>
                                <Text style={styles.qrButtonText}>📸 Přihlásit se pomocí QR kódu</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7', // Cream Mediterranean background
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 35,
    },
    flagText: {
        fontSize: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#112233', // Deep blue
    },
    subtitle: {
        fontSize: 16,
        color: '#8c7a6b',
        marginTop: 4,
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '600',
    },
    form: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#112233',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F9F6F0',
        borderWidth: 1,
        borderColor: '#E8E3D9',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#112233',
    },
    loginButton: {
        backgroundColor: '#E05A36', // Terracotta orange
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E3D9',
    },
    dividerText: {
        color: '#8c7a6b',
        paddingHorizontal: 10,
        fontSize: 12,
        fontWeight: 'bold',
    },
    qrButton: {
        borderWidth: 2,
        borderColor: '#0F5132', // Green accent
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    qrButtonText: {
        color: '#0F5132',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loader: {
        marginVertical: 20,
    }
});
