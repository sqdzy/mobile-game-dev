import { useCallback, useEffect, useState } from 'react';

/**
 * Хук для управления ресурсами приложения
 * Отслеживает состояние приложения (активное/фоновое) и управляет ресурсами
 */
export function useAppState(onBackground?: () => void, onForeground?: () => void) {
    const [isActive, setIsActive] = useState(true);
    const [appStateChangeCount, setAppStateChangeCount] = useState(0);

    useEffect(() => {
        // В React Native это можно расширить с AppState API
        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            setIsActive(isVisible);
            setAppStateChangeCount(prev => prev + 1);

            if (isVisible && onForeground) {
                onForeground();
            } else if (!isVisible && onBackground) {
                onBackground();
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [onBackground, onForeground]);

    return { isActive, appStateChangeCount };
}

/**
 * Хук для управления таймером с автоматической очисткой
 */
export function useInterval(callback: () => void, delay: number | null) {
    useEffect(() => {
        if (delay === null) return;

        const id = setInterval(callback, delay);
        return () => clearInterval(id);
    }, [callback, delay]);
}

/**
 * Хук для debounce функций
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Хук для отслеживания предыдущего значения
 */
export function usePrevious<T>(value: T): T | undefined {
    const [current, setCurrent] = useState<T>(value);
    const [previous, setPrevious] = useState<T | undefined>();

    useEffect(() => {
        if (current !== value) {
            setPrevious(current);
            setCurrent(value);
        }
    }, [value, current]);

    return previous;
}

/**
 * Хук для управления загрузкой данных
 */
export function useDataLoader<T>(
    loadFunction: () => Promise<T>,
    dependencies: any[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await loadFunction();
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, dependencies);

    useEffect(() => {
        load();
    }, [load]);

    const reload = useCallback(() => {
        load();
    }, [load]);

    return { data, loading, error, reload };
}
