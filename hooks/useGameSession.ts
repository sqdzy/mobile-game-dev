import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface GameSession {
    id: string;
    startTime: string;
    endTime?: string;
    messages: string[];
    stats: {
        match3: number;
        match4: number;
        match5: number;
        totalMatches: number;
    };
}

const SESSIONS_KEY = 'game_sessions';
const CURRENT_SESSION_KEY = 'current_session';
const MAX_SESSIONS = 10; // Максимальное количество сохраненных сессий

/**
 * Хук для управления игровыми сессиями
 * Сохраняет логи и статистику каждой игровой сессии
 */
export function useGameSession() {
    const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Загрузка сессий при монтировании
    useEffect(() => {
        loadSessions();
        loadCurrentSession();
    }, []);

    // Загрузка всех сохраненных сессий
    const loadSessions = async () => {
        try {
            const sessionsJson = await AsyncStorage.getItem(SESSIONS_KEY);
            if (sessionsJson) {
                setSessions(JSON.parse(sessionsJson));
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    // Загрузка текущей сессии
    const loadCurrentSession = async () => {
        try {
            setLoading(true);
            const sessionJson = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
            if (sessionJson) {
                setCurrentSession(JSON.parse(sessionJson));
            } else {
                // Создаем новую сессию если её нет
                await startNewSession();
            }
        } catch (error) {
            console.error('Error loading current session:', error);
        } finally {
            setLoading(false);
        }
    };

    // Начать новую игровую сессию
    const startNewSession = useCallback(async () => {
        try {
            // Завершаем предыдущую сессию если она есть
            if (currentSession) {
                await endCurrentSession();
            }

            const newSession: GameSession = {
                id: Date.now().toString(),
                startTime: new Date().toISOString(),
                messages: [],
                stats: {
                    match3: 0,
                    match4: 0,
                    match5: 0,
                    totalMatches: 0,
                },
            };

            setCurrentSession(newSession);
            await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newSession));
            
            return newSession;
        } catch (error) {
            console.error('Error starting new session:', error);
            return null;
        }
    }, [currentSession]);

    // Завершить текущую сессию
    const endCurrentSession = useCallback(async () => {
        if (!currentSession) return;

        try {
            const completedSession: GameSession = {
                ...currentSession,
                endTime: new Date().toISOString(),
            };

            // Добавляем завершенную сессию в список
            const updatedSessions = [completedSession, ...sessions].slice(0, MAX_SESSIONS);
            setSessions(updatedSessions);
            
            await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
            await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
            
            setCurrentSession(null);
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }, [currentSession, sessions]);

    // Добавить сообщение в текущую сессию
    const addMessage = useCallback(async (message: string) => {
        if (!currentSession) return;

        try {
            const updatedSession = {
                ...currentSession,
                messages: [...currentSession.messages, `${new Date().toLocaleTimeString()}: ${message}`],
            };

            setCurrentSession(updatedSession);
            await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(updatedSession));
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }, [currentSession]);

    // Обновить статистику текущей сессии
    const updateStats = useCallback(async (stats: Partial<GameSession['stats']>) => {
        if (!currentSession) return;

        try {
            const updatedSession = {
                ...currentSession,
                stats: {
                    ...currentSession.stats,
                    ...stats,
                },
            };

            setCurrentSession(updatedSession);
            await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(updatedSession));
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }, [currentSession]);

    // Очистить все сохраненные сессии
    const clearAllSessions = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(SESSIONS_KEY);
            setSessions([]);
        } catch (error) {
            console.error('Error clearing sessions:', error);
        }
    }, []);

    // Получить сессию по ID
    const getSessionById = useCallback((id: string): GameSession | undefined => {
        return sessions.find(session => session.id === id);
    }, [sessions]);

    return {
        currentSession,
        sessions,
        loading,
        startNewSession,
        endCurrentSession,
        addMessage,
        updateStats,
        clearAllSessions,
        getSessionById,
    };
}
