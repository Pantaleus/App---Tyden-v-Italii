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

    // Timeline Step Form states
    const [timelineSteps, setTimelineSteps] = useState([]);
    const [editingStepId, setEditingStepId] = useState(null);
    const [stepType, setStepType] = useState('walk');
    const [stepOrder, setStepOrder] = useState('');
    const [stepDep, setStepDep] = useState('');
    const [stepArr, setStepArr] = useState('');

    const [stepTitleCs, setStepTitleCs] = useState('');
    const [stepTextCs, setStepTextCs] = useState('');
    
    const [stepTitleEn, setStepTitleEn] = useState('');
    const [stepTextEn, setStepTextEn] = useState('');

    const [stepTitleIt, setStepTitleIt] = useState('');
    const [stepTextIt, setStepTextIt] = useState('');

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

        // Load timeline steps
        const sortedSteps = [...(trip.steps || [])].sort((a, b) => a.step_order - b.step_order);
        setTimelineSteps(sortedSteps);
        setStepOrder((sortedSteps.length + 1).toString());

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
                            await apiPost(`/api/trips/${id}/delete`);
                            Alert.alert('Úspěch', 'Cesta byla smazána.');
                            fetchTrips();
                        } catch (e) {
                            Alert.alert('Chyba', 'Cestu se nepodařilo smazat: ' + e.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetStepForm = () => {
        setEditingStepId(null);
        setStepType('walk');
        setStepOrder((timelineSteps.length + 1).toString());
        setStepDep('');
        setStepArr('');
        setStepTitleCs(''); setStepTextCs('');
        setStepTitleEn(''); setStepTextEn('');
        setStepTitleIt(''); setStepTextIt('');
    };

    const handleEditStep = (step) => {
        setEditingStepId(step.id);
        setStepType(step.transport_type);
        setStepOrder(step.step_order.toString());
        setStepDep(step.departure_time || '');
        setStepArr(step.arrival_time || '');

        const tr = step.translations || {};
        setStepTitleCs(tr.cs?.title || '');
        setStepTextCs(tr.cs?.text || '');

        setStepTitleEn(tr.en?.title || '');
        setStepTextEn(tr.en?.text || '');

        setStepTitleIt(tr.it?.title || '');
        setStepTextIt(tr.it?.text || '');
    };

    const handleSaveStep = async () => {
        if (!stepTitleCs) {
            Alert.alert('Chyba', 'Název kroku v češtině je povinný.');
            return;
        }

        setLoading(true);
        try {
            const body = {
                step_type: stepType,
                step_order: parseInt(stepOrder) || 0,
                step_dep: stepDep,
                step_arr: stepArr,
                step_title_cs: stepTitleCs,
                step_text_cs: stepTextCs,
                step_title_en: stepTitleEn,
                step_text_en: stepTextEn,
                step_title_it: stepTitleIt,
                step_text_it: stepTextIt,
            };

            if (editingStepId) {
                await apiPost(`/api/trips/${editingTripId}/timeline/${editingStepId}`, body);
                Alert.alert('Úspěch', 'Krok časové osy byl upraven.');
            } else {
                await apiPost(`/api/trips/${editingTripId}/timeline`, body);
                Alert.alert('Úspěch', 'Krok časové osy byl přidán.');
            }

            const updatedTrips = await apiGet('/api/trips');
            setTrips(updatedTrips);
            const currentTrip = updatedTrips.find(t => t.id === editingTripId);
            let sortedSteps = [];
            if (currentTrip) {
                sortedSteps = [...(currentTrip.steps || [])].sort((a, b) => a.step_order - b.step_order);
                setTimelineSteps(sortedSteps);
            }
            
            setEditingStepId(null);
            setStepType('walk');
            setStepOrder((sortedSteps.length + 1).toString());
            setStepDep('');
            setStepArr('');
            setStepTitleCs(''); setStepTextCs('');
            setStepTitleEn(''); setStepTextEn('');
            setStepTitleIt(''); setStepTextIt('');
        } catch (e) {
            Alert.alert('Chyba', 'Uložení kroku selhalo: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStep = (stepId) => {
        Alert.alert(
            'Smazat krok',
            'Opravdu chcete tento krok smazat z časové osy?',
            [
                { text: 'Zrušit', style: 'cancel' },
                {
                    text: 'Smazat',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await apiPost(`/api/trips/${editingTripId}/timeline/${stepId}/delete`);
                            
                            const updatedTrips = await apiGet('/api/trips');
                            setTrips(updatedTrips);
                            const currentTrip = updatedTrips.find(t => t.id === editingTripId);
                            let sortedSteps = [];
                            if (currentTrip) {
                                sortedSteps = [...(currentTrip.steps || [])].sort((a, b) => a.step_order - b.step_order);
                                setTimelineSteps(sortedSteps);
                            }
                            
                            setEditingStepId(null);
                            setStepType('walk');
                            setStepOrder((sortedSteps.length + 1).toString());
                            setStepDep('');
                            setStepArr('');
                            setStepTitleCs(''); setStepTextCs('');
                            setStepTitleEn(''); setStepTextEn('');
                            setStepTitleIt(''); setStepTextIt('');

                            Alert.alert('Úspěch', 'Krok byl smazán.');
                        } catch (e) {
                            Alert.alert('Chyba', 'Smazání kroku selhalo: ' + e.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleMoveStep = async (index, direction) => {
        const newSteps = [...timelineSteps];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (swapIndex < 0 || swapIndex >= newSteps.length) return;

        const temp = newSteps[index];
        newSteps[index] = newSteps[swapIndex];
        newSteps[swapIndex] = temp;

        newSteps.forEach((step, idx) => {
            step.step_order = idx + 1;
        });

        setTimelineSteps(newSteps);

        try {
            const order = newSteps.map(s => s.id);
            await apiPost(`/api/trips/${editingTripId}/timeline/reorder`, { order });
            
            const updatedTrips = await apiGet('/api/trips');
            setTrips(updatedTrips);
        } catch (e) {
            Alert.alert('Chyba', 'Změna pořadí se neuložila na server: ' + e.message);
            fetchTrips();
        }
    };

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setCoverImage('');
        setIsActive(true);
        setTitleCs(''); setDescCs('');
        setTitleEn(''); setDescEn('');
        setTitleIt(''); setDescIt('');
        setTimelineSteps([]);
        setEditingStepId(null);
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

                {/* Timeline Section */}
                {editingTripId && (
                    <View style={{ marginTop: 10 }}>
                        <Text style={[styles.sectionTitle, { fontSize: 18, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#E8E3D9', paddingBottom: 6 }]}>
                            📍 Časová osa (Timeline)
                        </Text>
                        
                        {/* Step Form Card */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>
                                {editingStepId ? 'Upravit krok časové osy' : 'Přidat nový krok'}
                            </Text>

                            <Text style={styles.label}>Typ dopravy / ikona</Text>
                            <TextInput 
                                style={styles.input} 
                                value={stepType} 
                                onChangeText={setStepType} 
                                placeholder="Např. flight, train, bus, walk, hotel, car, taxi" 
                            />

                            <Text style={styles.label}>Čas odjezdu / Od (Departure)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={stepDep} 
                                onChangeText={setStepDep} 
                                placeholder="Např. 10:15 nebo Den 1" 
                            />

                            <Text style={styles.label}>Čas příjezdu / Do (Arrival)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={stepArr} 
                                onChangeText={setStepArr} 
                                placeholder="Např. 12:00" 
                            />

                            {/* Translations inside step form based on activeTab */}
                            {activeTab === 'cs' && (
                                <View>
                                    <Text style={styles.label}>Název kroku (CZ) *</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={stepTitleCs} 
                                        onChangeText={setStepTitleCs} 
                                        placeholder="Let z Prahy" 
                                    />

                                    <Text style={styles.label}>Podrobnosti (CZ)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={stepTextCs} 
                                        onChangeText={setStepTextCs} 
                                        placeholder="Ryanair, letadlo..." 
                                        multiline 
                                    />
                                </View>
                            )}

                            {activeTab === 'en' && (
                                <View>
                                    <Text style={styles.label}>Název kroku (EN)</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={stepTitleEn} 
                                        onChangeText={setStepTitleEn} 
                                        placeholder="Flight from Prague" 
                                    />

                                    <Text style={styles.label}>Podrobnosti (EN)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={stepTextEn} 
                                        onChangeText={setStepTextEn} 
                                        placeholder="Details..." 
                                        multiline 
                                    />
                                </View>
                            )}

                            {activeTab === 'it' && (
                                <View>
                                    <Text style={styles.label}>Název kroku (IT)</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={stepTitleIt} 
                                        onChangeText={setStepTitleIt} 
                                        placeholder="Volo da Praga" 
                                    />

                                    <Text style={styles.label}>Podrobnosti (IT)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={stepTextIt} 
                                        onChangeText={setStepTextIt} 
                                        placeholder="Dettagli..." 
                                        multiline 
                                    />
                                </View>
                            )}

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#E05A36', marginTop: 10 }]} onPress={handleSaveStep}>
                                <Text style={styles.saveBtnText}>{editingStepId ? 'Uložit změny kroku' : 'Přidat krok na osu'}</Text>
                            </TouchableOpacity>

                            {editingStepId && (
                                <TouchableOpacity style={[styles.cancelBtn, { marginTop: 8, alignItems: 'center', justifyContent: 'center' }]} onPress={resetStepForm}>
                                    <Text style={styles.cancelBtnText}>Zrušit úpravu</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Steps List */}
                        <Text style={styles.sectionTitle}>Aktuální kroky na ose ({timelineSteps.length})</Text>
                        {timelineSteps.length === 0 ? (
                            <Text style={styles.emptyText}>Časová osa nemá žádné kroky.</Text>
                        ) : (
                            timelineSteps.map((st, idx) => (
                                <View key={st.id} style={styles.stepCard}>
                                    <View style={styles.stepCardHeader}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.stepTitle}>
                                                Krok #{idx + 1} - {st.transport_type}
                                            </Text>
                                            <Text style={styles.stepName}>
                                                {st.translations?.cs?.title || 'Bez názvu'}
                                                {st.departure_time ? ` (${st.departure_time} ➔ ${st.arrival_time || '?'})` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.reorderActions}>
                                            <TouchableOpacity 
                                                style={[styles.arrowBtn, idx === 0 && styles.disabledBtn]} 
                                                disabled={idx === 0} 
                                                onPress={() => handleMoveStep(idx, 'up')}
                                            >
                                                <Text style={styles.arrowText}>▲</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.arrowBtn, idx === timelineSteps.length - 1 && styles.disabledBtn]} 
                                                disabled={idx === timelineSteps.length - 1} 
                                                onPress={() => handleMoveStep(idx, 'down')}
                                            >
                                                <Text style={styles.arrowText}>▼</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {st.translations?.cs?.text ? (
                                        <Text style={styles.stepText}>{st.translations.cs.text}</Text>
                                    ) : null}

                                    <View style={[styles.cardActions, { marginTop: 8 }]}>
                                        <TouchableOpacity style={[styles.editBtn, { paddingVertical: 5, paddingHorizontal: 10 }]} onPress={() => handleEditStep(st)}>
                                            <Text style={[styles.editBtnText, { fontSize: 12 }]}>Upravit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.deleteBtn, { paddingVertical: 5, paddingHorizontal: 10 }]} onPress={() => handleDeleteStep(st.id)}>
                                            <Text style={[styles.deleteBtnText, { fontSize: 12 }]}>Smazat</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

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
    },
    stepCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderColor: '#E8E3D9',
        borderWidth: 1,
    },
    stepCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#E05A36',
    },
    stepName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#112233',
        marginTop: 2,
    },
    stepText: {
        fontSize: 12,
        color: '#8c7a6b',
        marginTop: 4,
    },
    reorderActions: {
        flexDirection: 'row',
        gap: 6,
    },
    arrowBtn: {
        backgroundColor: '#F9F6F0',
        borderColor: '#E8E3D9',
        borderWidth: 1,
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 12,
        color: '#112233',
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.3,
    }
});
