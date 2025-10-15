import React, { createContext, useContext, useEffect } from 'react';
import { useAppState } from '../hooks/useAppResources';
import { useGameSession } from '../hooks/useGameSession';

interface GameSessionContextType {
    currentSession: ReturnType<typeof useGameSession>['currentSession'];
    sessions: ReturnType<typeof useGameSession>['sessions'];
    loading: boolean;
    startNewSession: () => Promise<any>;
    endCurrentSession: () => Promise<void>;
    addMessage: (message: string) => Promise<void>;
    updateStats: (stats: any) => Promise<void>;
    clearAllSessions: () => Promise<void>;
    getSessionById: (id: string) => any;
}

const GameSessionContext = createContext<GameSessionContextType | null>(null);

export const useGameSessionContext = () => {
    const context = useContext(GameSessionContext);
    if (!context) {
        throw new Error('useGameSessionContext must be used within GameSessionProvider');
    }
    return context;
};

interface GameSessionProviderProps {
    children: React.ReactNode;
}

export const GameSessionProvider: React.FC<GameSessionProviderProps> = ({ children }) => {
    const gameSession = useGameSession();

    // Управление сессией в зависимости от состояния приложения
    const { isActive } = useAppState(
        // При переходе в фон
        async () => {
            console.log('App going to background - saving session');
            // Сессия автоматически сохраняется через хук
        },
        // При возврате на передний план
        async () => {
            console.log('App coming to foreground');
            // Можно добавить логику для возобновления сессии
        }
    );

    // Автоматически начинаем новую сессию при монтировании
    useEffect(() => {
        if (!gameSession.loading && !gameSession.currentSession) {
            gameSession.startNewSession();
        }
    }, [gameSession.loading]);

    return (
        <GameSessionContext.Provider value={gameSession}>
            {children}
        </GameSessionContext.Provider>
    );
};
