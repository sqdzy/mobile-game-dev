import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * Кастомный хук для работы с AsyncStorage
 * Управляет загрузкой, сохранением и удалением данных из локального хранилища
 */
export function useAsyncStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        loadStoredValue();
    }, [key]);

    const loadStoredValue = async () => {
        try {
            setLoading(true);
            setError(null);
            const item = await AsyncStorage.getItem(key);
            if (item !== null) {
                setStoredValue(JSON.parse(item));
            }
        } catch (e) {
            setError(e as Error);
            console.error(`Error loading ${key} from AsyncStorage:`, e);
        } finally {
            setLoading(false);
        }
    };

    // Сохранение значения в AsyncStorage
    const setValue = useCallback(async (value: T | ((val: T) => T)) => {
        try {
            setError(null);
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (e) {
            setError(e as Error);
            console.error(`Error saving ${key} to AsyncStorage:`, e);
        }
    }, [key, storedValue]);

    // Удаление значения из AsyncStorage
    const removeValue = useCallback(async () => {
        try {
            setError(null);
            setStoredValue(initialValue);
            await AsyncStorage.removeItem(key);
        } catch (e) {
            setError(e as Error);
            console.error(`Error removing ${key} from AsyncStorage:`, e);
        }
    }, [key, initialValue]);

    // Перезагрузка данных
    const reload = useCallback(() => {
        loadStoredValue();
    }, [key]);

    return { 
        value: storedValue, 
        setValue, 
        removeValue, 
        reload,
        loading, 
        error 
    };
}
