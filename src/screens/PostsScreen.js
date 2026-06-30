import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiGet, apiPost, apiUpload } from '../services/api';

export default function PostsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState('');
    
    // Form management
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [activeTab, setActiveTab] = useState('cs'); // Translation tab (cs, en, it)

    // Form inputs
    const [coverImage, setCoverImage] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [tripId, setTripId] = useState('');
    const [uploading, setUploading] = useState(false);

    // Multilingual states
    const [titleCs, setTitleCs] = useState('');
    const [contentCs, setContentCs] = useState('');
    const [metaTitleCs, setMetaTitleCs] = useState('');
    const [metaDescCs, setMetaDescCs] = useState('');

    const [titleEn, setTitleEn] = useState('');
    const [contentEn, setContentEn] = useState('');
    const [metaTitleEn, setMetaTitleEn] = useState('');
    const [metaDescEn, setMetaDescEn] = useState('');

    const [titleIt, setTitleIt] = useState('');
    const [contentIt, setContentIt] = useState('');
    const [metaTitleIt, setMetaTitleIt] = useState('');
    const [metaDescIt, setMetaDescIt] = useState('');

    const fetchPosts = async () => {
        try {
            setError('');
            const data = await apiGet('/api/posts');
            setPosts(data);
        } catch (e) {
            setError('Selhalo načítání článků: ' + e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const handleSelectImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert('Pro nahrávání fotek je nutný přístup ke galerii!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            quality: 1,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];
        setUploading(true);
        try {
            let uploadUri = asset.uri;
            let fileType = asset.mimeType || 'image/jpeg';
            let fileName = asset.fileName || 'upload.jpg';

            // HEIC/RAW to JPEG client-side conversion
            if (asset.type === 'image') {
                console.log('Converting/Compressing image...');
                const manipulated = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 1200 } }], // Resize slightly for web performance
                    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulated.uri;
                fileType = 'image/jpeg';
                fileName = 'upload_' + Date.now() + '.jpg';
            }

            console.log('Uploading file...');
            const uploadResult = await apiUpload(uploadUri, fileType, fileName);
            setCoverImage(uploadResult.url);
            Alert.alert('Úspěch', 'Obrázek byl úspěšně nahrán a nastaven jako úvodní.');
        } catch (e) {
            Alert.alert('Chyba', 'Nahrávání média selhalo: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!titleCs) {
            Alert.alert('Chyba', 'Název článku v češtině je povinný.');
            return;
        }

        setLoading(true);
        try {
            const body = {
                cover_image: coverImage,
                is_active: isActive ? 1 : 0,
                trip_id: tripId,
                title_cs: titleCs,
                content_cs: contentCs,
                meta_title_cs: metaTitleCs,
                meta_desc_cs: metaDescCs,
                title_en: titleEn,
                content_en: contentEn,
                meta_title_en: metaTitleEn,
                meta_desc_en: metaDescEn,
                title_it: titleIt,
                content_it: contentIt,
                meta_title_it: metaTitleIt,
                meta_desc_it: metaDescIt,
            };

            const endpoint = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
            await apiPost(endpoint, body);
            
            Alert.alert('Úspěch', editingPostId ? 'Článek byl upraven.' : 'Článek byl vytvořen.');
            setIsEditing(false);
            setEditingPostId(null);
            resetForm();
            fetchPosts();
        } catch (e) {
            Alert.alert('Chyba', 'Uložení selhalo: ' + e.message);
            setLoading(false);
        }
    };

    const handleEdit = (post) => {
        setEditingPostId(post.id);
        setCoverImage(post.cover_image || '');
        setIsActive(post.is_active === 1);
        setTripId(post.trip_id || '');

        // Translations mapping
        const tr = post.translations || {};
        setTitleCs(tr.cs?.title || '');
        setContentCs(tr.cs?.content || '');
        setMetaTitleCs(tr.cs?.meta_title || '');
        setMetaDescCs(tr.cs?.meta_description || '');

        setTitleEn(tr.en?.title || '');
        setContentEn(tr.en?.content || '');
        setMetaTitleEn(tr.en?.meta_title || '');
        setMetaDescEn(tr.en?.meta_description || '');

        setTitleIt(tr.it?.title || '');
        setContentIt(tr.it?.content || '');
        setMetaTitleIt(tr.it?.meta_title || '');
        setMetaDescIt(tr.it?.meta_description || '');

        setIsEditing(true);
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Smazat článek',
            'Opravdu chcete tento článek trvale smazat?',
            [
                { text: 'Zrušit', style: 'cancel' },
                { 
                    text: 'Smazat', 
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await apiPost(`/api/posts/${id}/delete`);
                            fetchPosts();
                        } catch (e) {
                            Alert.alert('Chyba', 'Článek se nepodařilo smazat: ' + e.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setCoverImage('');
        setIsActive(true);
        setTripId('');
        setTitleCs(''); setContentCs(''); setMetaTitleCs(''); setMetaDescCs('');
        setTitleEn(''); setContentEn(''); setMetaTitleEn(''); setMetaDescEn('');
        setTitleIt(''); setContentIt(''); setMetaTitleIt(''); setMetaDescIt('');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#E05A36" />
                <Text style={styles.loadingText}>Načítám články...</Text>
            </View>
        );
    }

    if (isEditing) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>{editingPostId ? 'Upravit článek' : 'Přidat článek'}</Text>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); resetForm(); }}>
                        <Text style={styles.cancelBtnText}>Zrušit</Text>
                    </TouchableOpacity>
                </View>

                {/* Cover Image Selection */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Úvodní fotografie</Text>
                    {coverImage ? (
                        <Image source={{ uri: coverImage }} style={styles.coverPreview} />
                    ) : (
                        <View style={[styles.coverPreview, styles.coverPlaceholder]}>
                            <Text style={styles.placeholderText}>Žádná vybraná fotografie</Text>
                        </View>
                    )}
                    {uploading ? (
                        <ActivityIndicator size="small" color="#E05A36" style={{ marginVertical: 10 }} />
                    ) : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectImage}>
                            <Text style={styles.uploadBtnText}>📸 Vybrat a převést fotografii</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* State Card */}
                <View style={styles.card}>
                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Článek je aktivní (zobrazen na webu)</Text>
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

                {/* Translation Fields */}
                <View style={styles.card}>
                    {activeTab === 'cs' && (
                        <View>
                            <Text style={styles.label}>Název článku (CZ) *</Text>
                            <TextInput style={styles.input} value={titleCs} onChangeText={setTitleCs} placeholder="Název článku" />

                            <Text style={styles.label}>Obsah článku (CZ)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={contentCs} onChangeText={setContentCs} placeholder="Obsah..." multiline numberOfLines={8} />

                            <Text style={styles.label}>SEO Titulek (Meta Title)</Text>
                            <TextInput style={styles.input} value={metaTitleCs} onChangeText={setMetaTitleCs} placeholder="Zadejte titulek" />

                            <Text style={styles.label}>SEO Popis (Meta Description)</Text>
                            <TextInput style={[styles.input, styles.textArea, { height: 60 }]} value={metaDescCs} onChangeText={setMetaDescCs} placeholder="Popis článku..." multiline numberOfLines={2} />
                        </View>
                    )}

                    {activeTab === 'en' && (
                        <View>
                            <Text style={styles.label}>Název článku (EN)</Text>
                            <TextInput style={styles.input} value={titleEn} onChangeText={setTitleEn} placeholder="Article Title" />

                            <Text style={styles.label}>Obsah článku (EN)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={contentEn} onChangeText={setContentEn} placeholder="Content..." multiline numberOfLines={8} />

                            <Text style={styles.label}>SEO Titulek (Meta Title - EN)</Text>
                            <TextInput style={styles.input} value={metaTitleEn} onChangeText={setMetaTitleEn} placeholder="Meta Title" />

                            <Text style={styles.label}>SEO Popis (Meta Description - EN)</Text>
                            <TextInput style={[styles.input, styles.textArea, { height: 60 }]} value={metaDescEn} onChangeText={setMetaDescEn} placeholder="Meta Description..." multiline numberOfLines={2} />
                        </View>
                    )}

                    {activeTab === 'it' && (
                        <View>
                            <Text style={styles.label}>Název článku (IT)</Text>
                            <TextInput style={styles.input} value={titleIt} onChangeText={setTitleIt} placeholder="Titolo articolo" />

                            <Text style={styles.label}>Obsah článku (IT)</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={contentIt} onChangeText={setContentIt} placeholder="Contenuto..." multiline numberOfLines={8} />

                            <Text style={styles.label}>SEO Titulek (Meta Title - IT)</Text>
                            <TextInput style={styles.input} value={metaTitleIt} onChangeText={setMetaTitleIt} placeholder="Meta Title" />

                            <Text style={styles.label}>SEO Popis (Meta Description - IT)</Text>
                            <TextInput style={[styles.input, styles.textArea, { height: 60 }]} value={metaDescIt} onChangeText={setMetaDescIt} placeholder="Meta Description..." multiline numberOfLines={2} />
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Uložit článek</Text>
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
                <Text style={styles.title}>Blogové články ✍️</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setIsEditing(true); }}>
                    <Text style={styles.addBtnText}>+ Přidat článek</Text>
                </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {posts.length === 0 ? (
                <Text style={styles.emptyText}>Zatím nebyly publikovány žádné články.</Text>
            ) : (
                posts.map((post) => (
                    <View key={post.id} style={styles.postCard}>
                        {post.cover_image ? (
                            <Image source={{ uri: post.cover_image }} style={styles.cardImage} />
                        ) : null}
                        <View style={styles.cardDetails}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.postTitle} numberOfLines={1}>{post.translations?.cs?.title || 'Článek bez názvu'}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: post.is_active === 1 ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={[styles.statusBadgeText, { color: post.is_active === 1 ? '#065F46' : '#991B1B' }]}>
                                        {post.is_active === 1 ? 'Aktivní' : 'Neaktivní'}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={styles.cardMeta}>Založeno: {new Date(post.created_at).toLocaleDateString('cs-CZ')}</Text>

                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(post)}>
                                    <Text style={styles.editBtnText}>Upravit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(post.id)}>
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
    postCard: {
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
    postTitle: {
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
        height: 100,
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
