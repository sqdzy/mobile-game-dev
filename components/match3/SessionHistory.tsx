import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameSessionContext } from '../../contexts/GameSessionContext';

const SessionHistory: React.FC = () => {
    const { sessions, currentSession, clearAllSessions } = useGameSessionContext();

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDuration = (start: string, end?: string) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60);
        return `${duration} мин`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>История сессий</Text>
                {sessions.length > 0 && (
                    <Pressable onPress={clearAllSessions} style={styles.clearButton}>
                        <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </Pressable>
                )}
            </View>

            {currentSession && (
                <View style={[styles.sessionCard, styles.currentSession]}>
                    <View style={styles.sessionHeader}>
                        <Text style={styles.sessionTitle}>Текущая сессия</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>АКТИВНАЯ</Text>
                        </View>
                    </View>
                    <Text style={styles.sessionTime}>
                        Начало: {formatDate(currentSession.startTime)}
                    </Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.statItem}>Match-3: {currentSession.stats.match3}</Text>
                        <Text style={styles.statItem}>Match-4: {currentSession.stats.match4}</Text>
                        <Text style={styles.statItem}>Match-5: {currentSession.stats.match5}</Text>
                    </View>
                    <Text style={styles.messagesCount}>
                        Сообщений: {currentSession.messages.length}
                    </Text>
                </View>
            )}

            <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
                {sessions.length === 0 ? (
                    <Text style={styles.emptyText}>История сессий пуста</Text>
                ) : (
                    sessions.map((session) => (
                        <View key={session.id} style={styles.sessionCard}>
                            <View style={styles.sessionHeader}>
                                <Text style={styles.sessionTitle}>
                                    Сессия {session.id}
                                </Text>
                                <Text style={styles.duration}>
                                    {getDuration(session.startTime, session.endTime)}
                                </Text>
                            </View>
                            <Text style={styles.sessionTime}>
                                {formatDate(session.startTime)}
                                {session.endTime && ` - ${formatDate(session.endTime)}`}
                            </Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statItem}>M3: {session.stats.match3}</Text>
                                <Text style={styles.statItem}>M4: {session.stats.match4}</Text>
                                <Text style={styles.statItem}>M5: {session.stats.match5}</Text>
                                <Text style={styles.statItem}>
                                    Всего: {session.stats.totalMatches}
                                </Text>
                            </View>
                            <Text style={styles.messagesCount}>
                                Сообщений: {session.messages.length}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    sessionsList: {
        flex: 1,
    },
    sessionCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    currentSession: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    duration: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    sessionTime: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    statItem: {
        fontSize: 12,
        color: '#333',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    messagesCount: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginTop: 20,
    },
});

export default observer(SessionHistory);
