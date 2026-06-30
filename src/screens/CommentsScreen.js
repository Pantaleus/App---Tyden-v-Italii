import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { apiGet, apiPost } from '../services/api';

export default function CommentsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState('');

    const fetchComments = async () => {
        try {
            setError('');
            const data = await apiGet('/api/comments');
            setComments(data);
        } catch (e) {
            setError('Nepodařilo se načíst komentáře: ' + e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchComments();
    };

    const handleApprove = async (id) => {
        try {
            await apiPost(`/api/comments/${id}/approve`);
            setComments(comments.map(c => c.id === id ? { ...c, is_approved: 1 } : c));
        } catch (e) {
            Alert.alert('Chyba', 'Nepodařilo se schválit komentář: ' + e.message);
        }
    };

    const handleSpam = async (id) => {
        try {
            await apiPost(`/api/comments/${id}/spam`);
            setComments(comments.map(c => c.id === id ? { ...c, is_approved: -1 } : c));
        } catch (e) {
            Alert.alert('Chyba', 'Nepodařilo se označit jako spam: ' + e.message);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Smazat komentář',
            'Opravdu chcete tento komentář trvale odstranit?',
            [
                { text: 'Zrušit', style: 'cancel' },
                { 
                    text: 'Smazat', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiPost(`/api/comments/${id}/delete`);
                            setComments(comments.filter(c => c.id !== id));
                        } catch (e) {
                            Alert.alert('Chyba', 'Komentář se nepodařilo smazat: ' + e.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#E05A36" />
                <Text style={styles.loadingText}>Načítám komentáře k moderaci...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>Správa komentářů 💬</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {comments.length === 0 ? (
                <Text style={styles.emptyText}>Zatím žádné komentáře k dispozici.</Text>
            ) : (
                comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                            <View>
                                <Text style={styles.author}>{comment.author_name}</Text>
                                <Text style={styles.meta}>{comment.author_email} • {new Date(comment.created_at).toLocaleDateString('cs-CZ')}</Text>
                            </View>
                            
                            {/* Status Badge */}
                            {comment.is_approved === 1 ? (
                                <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                                    <Text style={[styles.badgeText, { color: '#065F46' }]}>Schválen</Text>
                                </View>
                            ) : comment.is_approved === -1 ? (
                                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                                    <Text style={[styles.badgeText, { color: '#991B1B' }]}>Spam</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                                    <Text style={[styles.badgeText, { color: '#92400E' }]}>Čeká</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.postTitle}>Článek: {comment.post_title}</Text>
                        <Text style={styles.content}>{comment.content}</Text>

                        {/* Action buttons */}
                        <View style={styles.actions}>
                            {comment.is_approved !== 1 && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]} 
                                    onPress={() => handleApprove(comment.id)}
                                >
                                    <Text style={styles.actionBtnText}>Schválit</Text>
                                </TouchableOpacity>
                            )}

                            {comment.is_approved !== -1 && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} 
                                    onPress={() => handleSpam(comment.id)}
                                >
                                    <Text style={styles.actionBtnText}>Spam</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} 
                                onPress={() => handleDelete(comment.id)}
                            >
                                <Text style={styles.actionBtnText}>Smazat</Text>
                            </TouchableOpacity>
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
    commentCard: {
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
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    author: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#112233',
    },
    meta: {
        fontSize: 12,
        color: '#8c7a6b',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    postTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E05A36',
        backgroundColor: '#FDFBF7',
        padding: 6,
        borderRadius: 6,
        marginVertical: 8,
    },
    content: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 15,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    emptyText: {
        color: '#8c7a6b',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    }
});
