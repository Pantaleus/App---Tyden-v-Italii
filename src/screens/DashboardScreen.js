import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiGet } from '../services/api';

export default function DashboardScreen({ onNavigate }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        try {
            setError('');
            const data = await apiGet('/api/stats');
            setStats(data);
        } catch (e) {
            setError('Selhalo načítání statistik: ' + e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#E05A36" />
                <Text style={styles.loadingText}>Načítám přehled návštěvnosti...</Text>
            </View>
        );
    }

    const metrics = stats?.metrics || { total_views: 0, unique_visitors: 0, total_countries: 0, pending_comments: 0 };

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>Přehled návštěvnosti 🇮🇹</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* KPI Cards Grid */}
            <View style={styles.grid}>
                <View style={[styles.card, { borderLeftColor: '#E05A36' }]}>
                    <Text style={styles.cardLabel}>Zobrazení stránek</Text>
                    <Text style={styles.cardValue}>{metrics.total_views}</Text>
                </View>
                
                <View style={[styles.card, { borderLeftColor: '#3B82F6' }]}>
                    <Text style={styles.cardLabel}>Unikátní návštěvy</Text>
                    <Text style={styles.cardValue}>{metrics.unique_visitors}</Text>
                </View>
                
                <View style={[styles.card, { borderLeftColor: '#10B981' }]}>
                    <Text style={styles.cardLabel}>Státy světa</Text>
                    <Text style={styles.cardValue}>{metrics.total_countries}</Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.card, { borderLeftColor: '#F59E0B' }]}
                    onPress={() => onNavigate('comments')}
                >
                    <Text style={styles.cardLabel}>Komentáře k schválení</Text>
                    <Text style={[styles.cardValue, metrics.pending_comments > 0 && { color: '#D97706' }]}>
                        {metrics.pending_comments}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Top Visited Pages */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nejnavštěvovanější stránky</Text>
                {stats?.top_pages?.length === 0 ? (
                    <Text style={styles.emptyText}>Zatím žádné záznamy</Text>
                ) : (
                    stats?.top_pages?.map((page, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.tableColMain} numberOfLines={1}>{page.url_path}</Text>
                            <Text style={styles.tableColVal}>{page.cnt}x</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Top Countries */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Návštěvy podle států</Text>
                {stats?.top_countries?.length === 0 ? (
                    <Text style={styles.emptyText}>Zatím žádná data z lokalizace</Text>
                ) : (
                    stats?.top_countries?.map((c, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.tableColMain} numberOfLines={1}>
                                {c.country_name || 'Neznámý'} ({c.country_code})
                            </Text>
                            <Text style={styles.tableColVal}>{c.cnt}x</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Device breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Zobrazení podle zařízení</Text>
                {stats?.devices?.length === 0 ? (
                    <Text style={styles.emptyText}>Zatím žádné záznamy</Text>
                ) : (
                    stats?.devices?.map((d, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.tableColMain} style={{ textTransform: 'capitalize' }}>
                                {d.device === 'desktop' ? '💻 Počítač' : d.device === 'tablet' ? '📟 Tablet' : '📱 Mobil'}
                            </Text>
                            <Text style={styles.tableColVal}>{d.cnt}x</Text>
                        </View>
                    ))
                )}
            </View>

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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    card: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 5,
        shadowColor: '#8c7a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 12,
        color: '#8c7a6b',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#112233',
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
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F6F0',
    },
    tableColMain: {
        fontSize: 14,
        color: '#112233',
        flex: 1,
        marginRight: 10,
    },
    tableColVal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8c7a6b',
    },
    emptyText: {
        color: '#8c7a6b',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    }
});
