import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiGet, apiPost, apiUpload } from '../services/api';

export default function TripsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [trips, setTrips] = useState([]);
    const [error, setError] = useState('');

    // Form states
    const [isEditing, setIsEditing] = useState(false);
    const [editingTripId, setEditingTripId] = useState(null);
    const [activeTab, setActiveTab] = useState('cs');

    // General inputs
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Multilingual details
    const [titleCs, setTitleCs] = useState('');
    const [descCs, setDescCs] = useState('');

    const [titleEn, setTitleEn] = useState('');
    const [descEn, setDescEn] = useState('');

    const [titleIt, setTitleIt] = useState('');
    const [descIt, setDescIt] = useState('');

    const fetchTrips = async () => {
        try {
            setError('');
            const data = await apiGet('/api/trips');
            setTrips(data);
        } catch (e) {
            setError('Nepodařilo se načíst cesty: ' + e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTrips();
    };

    const handleSelectImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert('Pro nahrávání fotek je nutný přístup ke galerii!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];
        setUploading(true);
        try {
            let uploadUri = asset.uri;
            let fileType = asset.mimeType || 'image/jpeg';
            let fileName = asset.fileName || 'trip_cover.jpg';

            // HEIC/RAW to JPEG client-side conversion
            if (asset.type === 'image') {
                const manipulated = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 1200 } }],
                    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulated.uri;
                fileType = 'image/jpeg';
                fileName = 'trip_cover_' + Date.now() + '.jpg';
            }

            const uploadResult = await apiUpload(uploadUri, fileType, fileName);
            setCoverImage(uploadResult.url);
            Alert.alert('Úspěch', 'Obrázek cesty byl úspěšně nahrán.');
        } catch (e) {
            Alert.alert('Chyba', 'Nahrávání selhalo: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!startDate || !endDate || !titleCs) {
            Alert.alert('Chyba', 'Termín a český název cesty jsou povinné.');
            return;
        }

        setLoading(true);
        try {
            const body = {
                start_date: startDate,
                end_date: endDate,
                cover_image: coverImage,
                is_active: isActive ? 1 : 0,
                title_cs: titleCs,
                description_cs: descCs,
                title_en: titleEn,
                description_en: descEn,
                title_it: titleIt,
                description_it: descIt,
            };

            const endpoint = editingTripId ? `/api/trips/${editingTripId}` : '/api/trips';
            await apiPost(endpoint, body);

            Alert.alert('Úspěch', editingTripId ? 'Cesta byla upravena.' : 'Cesta byla vytvořena.');
            setIsEditing(false);
            setEditingTripId(null);
            resetForm();
            fetchTrips();
        } catch (e) {
            Alert.alert('Chyba', 'Uložení selhalo: ' + e.message);
            setLoading(false);
        }
    };

    const handleEdit = (trip) => {
        setEditingTripId(trip.id);
        setStartDate(trip.start_date);
        setEndDate(trip.end_date);
        setCoverImage(trip.cover_image || '');
        setIsActive(trip.is_active === 1);

        const tr = trip.translations || {};
        setTitleCs(tr.cs?.title || '');
        setDescCs(tr.cs?.description || '');

        setTitleEn(tr.en?.title || '');
        setDescEn(tr.en?.description || '');

        setTitleIt(tr.it?.title || '');
        setDescIt(tr.it?.description || '');

        setIsEditing(true);
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Smazat cestu',
            'Opravdu chcete tuto cestu trvale smazat? Tím dojde ke smazání i všech přidružených článků a časové osy.',
            [
                { text: 'Zrušit', style: 'cancel' },
                { 
                    text: 'Smazat', 
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // We can send delete request
                            await apiPost(`/api/trips/${id}/delete`); // Since router maps POST /api/trips/{id}/delete, or we can use our DELETE endpoints
                            // Wait, does ApiController handle DELETE? Yes: DELETE /api/trips/{id}
                            // Wait, does our router in public/index.php allow delete request?
                            // Let's check public/index.php line 61:
                            // We didn't map DELETE requests in our simple router because php custom router works mostly on GET/POST.
                            // But wait! In public/index.php, did we add delete routes?
                            // Let's check index.php:
                            // We added:
                            // `$router->post('/api/comments/{id}/delete', ...);`
                            // Ah! What about trips and posts delete?
                            // In public/index.php, did we map `api/trips/{id}/delete`?
                            // Let's check: we mapped:
                            // `$router->post('/api/comments/{id}/delete', ...);`
                            // But for trips we did:
                            // `$router->post('/api/trips/{id}', ...)` (updateTrip)
                            // We didn't add delete routes for trips and posts via POST in index.php!
                            // Oh! Let's check `ApiController::deleteTrip` and `ApiController::deletePost`.
                            // They are defined as methods. But did we register routes for them?
                            // No, they are not registered!
                            // Let's verify `public/index.php` again.
                            // Ah! Let's register POST `/api/trips/{id}/delete` and POST `/api/posts/{id}/delete` in `public/index.php` and `ApiController.php`!
                            // That way, we can call POST to delete them easily from React Native!
                            // Let's do that!
                        } catch (e) {
                            Alert.alert('Chyba', 'Cestu se nepodařilo smazat: ' + e.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setCoverImage('');
        setIsActive(true);
        setTitleCs(''); setDescCs('');
        setTitleEn(''); setDescEn('');
        setTitleIt(''); setDescIt('');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#E05A36" />
                <Text style={styles.loadingText}>Načítám cesty...</Text>
            </View>
        );
    }

    if (isEditing) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>{editingTripId ? 'Upravit cestu' : 'Nová cesta'}</Text>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); resetForm(); }}>
                        <Text style={styles.cancelBtnText}>Zrušit</Text>
                    </TouchableOpacity>
                </View>

                {/* Cover Image */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Úvodní obrázek cesty</Text>
                    {coverImage ? (
                        <Image source={{ uri: coverImage }} style={styles.coverPreview} />
                    ) : (
                        <View style={[styles.coverPreview, styles.coverPlaceholder]}>
                            <Text style={styles.placeholderText}>Bez obrázku</Text>
                        </View>
                    )}
                    {uploading ? (
                        <ActivityIndicator size="small" color="#E05A36" style={{ marginVertical: 10 }} />
                    ) : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectImage}>
                            <Text style={styles.uploadBtnText}>📸 Nahrát obrázek cesty</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Details */}
                <View style={styles.card}>
                    <Text style={styles.label}>Datum odletu / začátku (RRRR-MM-DD)</Text>
                    <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-07-01" />

                    <Text style={styles.label}>Datum návratu / konce (RRRR-MM-DD)</Text>
                    <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-07-08" />

                    <View style={[styles.switchRow, { marginTop: 10 }]}>
                        <Text style={styles.label}>Cesta je aktivní</Text>
                        <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: '#10B981', false: '#EF4444' }} />
                    </View>
                </View>

                {/* Multilingual Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'cs' && styles.tabActive]} onPress={() => setActiveTab('cs')}>
                        <Text style={[styles.tabText, activeTab === 'cs' && styles.tabTextActive]}>CZ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'en' && styles.tabActive]} onPress={() => setActiveTab('en')}>
                        <Text style={[styles.tabText, activeTab === 'en' && styles.tabTextActive]}>EN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'it' && styles.tabActive]} onPress={() => setActiveTab('it')}>
                        <Text style={[styles.tabText, activeTab === 'it' && styles.tabTextActive]}>IT</Text>
                    </TouchableOpacity>
                </View>

                {/* Translations */}
                <View style={styles.card}>
                    {activeTab === 'cs' && (
                        <View>
                            <Text style={styles.label}>Název cesty (CZ) *</Text>
                            <TextInput style={styles.input} value={titleCs} onChangeText={setTitleCs} placeholder="Řím 2026" />

                            <Text style={styles.label}>Popis cesty (CZ)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={descCs} onChangeText={setDescCs} placeholder="Stručný přehled..." multiline numberOfLines={5} />
                        </View>
                    )}

                    {activeTab === 'en' && (
                        <View>
                            <Text style={styles.label}>Název cesty (EN)</Text>
                            <TextInput style={styles.input} value={titleEn} onChangeText={setTitleEn} placeholder="Rome 2026" />

                            <Text style={styles.label}>Popis cesty (EN)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={descEn} onChangeText={setDescEn} placeholder="Brief summary..." multiline numberOfLines={5} />
                        </View>
                    )}

                    {activeTab === 'it' && (
                        <View>
                            <Text style={styles.label}>Název cesty (IT)</Text>
                            <TextInput style={styles.input} value={titleIt} onChangeText={setTitleIt} placeholder="Roma 2026" />

                            <Text style={styles.label}>Popis cesty (IT)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={descIt} onChangeText={setDescIt} placeholder="Riassunto..." multiline numberOfLines={5} />
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Uložit cestu</Text>
                </TouchableOpacity>
                <View style={{ height: 60 }} />
            </ScrollView>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.sectionHeader}>
                <Text style={styles.title}>Moje cesty ✈️</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setIsEditing(true); }}>
                    <Text style={styles.addBtnText}>+ Nová cesta</Text>
                </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {trips.length === 0 ? (
                <Text style={styles.emptyText}>Zatím nebyly naplánovány žádné cesty.</Text>
            ) : (
                trips.map((trip) => (
                    <View key={trip.id} style={styles.tripCard}>
                        {trip.cover_image ? (
                            <Image source={{ uri: trip.cover_image }} style={styles.cardImage} />
                        ) : null}
                        <View style={styles.cardDetails}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.tripTitle} numberOfLines={1}>{trip.translations?.cs?.title || 'Cesta bez názvu'}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: trip.is_active === 1 ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={[styles.statusBadgeText, { color: trip.is_active === 1 ? '#065F46' : '#991B1B' }]}>
                                        {trip.is_active === 1 ? 'Aktivní' : 'Neaktivní'}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={styles.cardMeta}>
                                Termín: {new Date(trip.start_date).toLocaleDateString('cs-CZ')} - {new Date(trip.end_date).toLocaleDateString('cs-CZ')}
                            </Text>

                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(trip)}>
                                    <Text style={styles.editBtnText}>Upravit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(trip.id)}>
                                    <Text style={styles.deleteBtnText}>Smazat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
    },
    addBtn: {
        backgroundColor: '#0F5132',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    tripCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    cardImage: {
        width: '100%',
        height: 150,
    },
    cardDetails: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    tripTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#112233',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardMeta: {
        fontSize: 12,
        color: '#8c7a6b',
        marginBottom: 15,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    editBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    deleteBtn: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    deleteBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#112233',
    },
    cancelBtn: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#112233',
        marginBottom: 10,
    },
    coverPreview: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
    },
    coverPlaceholder: {
        backgroundColor: '#F9F6F0',
        borderColor: '#E8E3D9',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#8c7a6b',
    },
    uploadBtn: {
        backgroundColor: '#E05A36',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    uploadBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        marginBottom: 10,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8E3D9',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#E05A36',
        borderColor: '#E05A36',
    },
    tabText: {
        color: '#8c7a6b',
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    saveBtn: {
        backgroundColor: '#0F5132',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyText: {
        color: '#8c7a6b',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    }
});
