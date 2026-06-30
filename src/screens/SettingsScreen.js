import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Fallback to standard picker if needed, but we can write a clean, native option selection or use Picker
// To keep things simple and zero-dependency, let's write a simple styled button toggle for the theme rather than bringing in picker packages which can sometimes crash or be missing in Expo!
// Yes, button toggles for themes are 100% reliable and look way more custom/premium!
import { apiGet, apiPost, clearCredentials, getBaseUrl } from '../services/api';

export default function SettingsScreen({ onLogout }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTheme, setActiveTheme] = useState('warm_mediterranean');
    const [tinymceApiKey, setTinymceApiKey] = useState('');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFromEmail, setSmtpFromEmail] = useState('');
    const [smtpFromName, setSmtpFromName] = useState('');
    const [error, setError] = useState('');

    const fetchSettings = async () => {
        try {
            setError('');
            const data = await apiGet('/api/settings');
            setActiveTheme(data.active_theme || 'warm_mediterranean');
            setTinymceApiKey(data.tinymce_api_key || '');
            setSmtpHost(data.smtp_host || '');
            setSmtpPort(data.smtp_port || '');
            setSmtpUser(data.smtp_user || '');
            setSmtpPass(data.smtp_pass || '');
            setSmtpFromEmail(data.smtp_from_email || '');
            setSmtpFromName(data.smtp_from_name || '');
        } catch (e) {
            setError('Nepodařilo se načíst nastavení: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await apiPost('/api/settings', {
                active_theme: activeTheme,
                tinymce_api_key: tinymceApiKey,
                smtp_host: smtpHost,
                smtp_port: smtpPort,
                smtp_user: smtpUser,
                smtp_pass: smtpPass,
                smtp_from_email: smtpFromEmail,
                smtp_from_name: smtpFromName
            });
            Alert.alert('Úspěch', 'Nastavení bylo úspěšně uloženo na server.');
        } catch (e) {
            setError('Chyba při ukládání: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Odhlásit se',
            'Opravdu se chcete odhlásit z této aplikace?',
            [
                { text: 'Zrušit', style: 'cancel' },
                { 
                    text: 'Odhlásit', 
                    style: 'destructive',
                    onPress: async () => {
                        await clearCredentials();
                        onLogout();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#E05A36" />
                <Text style={styles.loadingText}>Načítám nastavení...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.title}>Nastavení webu ⚙️</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vzhled a téma webu</Text>
                <Text style={styles.label}>Aktivní grafické téma webu</Text>
                
                <View style={styles.themeToggleContainer}>
                    <TouchableOpacity 
                        style={[styles.themeBtn, activeTheme === 'warm_mediterranean' && styles.themeBtnActive]}
                        onPress={() => setActiveTheme('warm_mediterranean')}
                    >
                        <Text style={[styles.themeBtnText, activeTheme === 'warm_mediterranean' && styles.themeBtnTextActive]}>
                            ☀️ Středomoří
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.themeBtn, activeTheme === 'italian_tricolore' && styles.themeBtnActive]}
                        onPress={() => setActiveTheme('italian_tricolore')}
                    >
                        <Text style={[styles.themeBtnText, activeTheme === 'italian_tricolore' && styles.themeBtnTextActive]}>
                            🇮🇹 Trikolóra
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Editory a API klíče</Text>
                <Text style={styles.label}>TinyMCE API Klíč (pro webový editor)</Text>
                <TextInput 
                    style={styles.input}
                    value={tinymceApiKey}
                    onChangeText={setTinymceApiKey}
                    placeholder="TinyMCE api key"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SMTP odesílání e-mailů</Text>
                
                <Text style={styles.label}>SMTP Hostitel</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpHost}
                    onChangeText={setSmtpHost}
                    placeholder="localhost"
                />

                <Text style={styles.label}>SMTP Port</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpPort}
                    onChangeText={setSmtpPort}
                    placeholder="587"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>SMTP Uživatel</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpUser}
                    onChangeText={setSmtpUser}
                    placeholder="info@tyden-v-italii.eu"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>SMTP Heslo</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpPass}
                    onChangeText={setSmtpPass}
                    placeholder="••••••••"
                    secureTextEntry
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Odesílatelský e-mail (From)</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpFromEmail}
                    onChangeText={setSmtpFromEmail}
                    placeholder="info@tyden-v-italii.eu"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Odesílatelské jméno</Text>
                <TextInput 
                    style={styles.input}
                    value={smtpFromName}
                    onChangeText={setSmtpFromName}
                    placeholder="Týden v Itálii"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Přihlášený server</Text>
                <Text style={styles.infoText}>API URL: {getBaseUrl()}</Text>
            </View>

            {saving ? (
                <ActivityIndicator size="large" color="#E05A36" style={{ marginVertical: 20 }} />
            ) : (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Uložit nastavení</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Odhlásit se z aplikace</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFBF7',
    },
    loadingText: {
        marginTop: 12,
        color: '#8c7a6b',
        fontSize: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
        marginBottom: 20,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#112233',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E3D9',
        paddingBottom: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#112233',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#F9F6F0',
        borderWidth: 1,
        borderColor: '#E8E3D9',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#112233',
    },
    themeToggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    themeBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E8E3D9',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F9F6F0',
    },
    themeBtnActive: {
        borderColor: '#E05A36',
        backgroundColor: '#FDF2EE',
    },
    themeBtnText: {
        color: '#8c7a6b',
        fontWeight: 'bold',
        fontSize: 14,
    },
    themeBtnTextActive: {
        color: '#E05A36',
    },
    infoText: {
        fontSize: 14,
        color: '#8c7a6b',
    },
    buttonContainer: {
        gap: 12,
        marginBottom: 20,
    },
    saveBtn: {
        backgroundColor: '#E05A36',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutBtn: {
        borderWidth: 2,
        borderColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    logoutBtnText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
