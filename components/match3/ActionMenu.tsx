import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRootStore } from '@/store/RootStore';
import { AppIcon } from '../ui/AppIcon';

const ActionMenu: React.FC = () => {
    const router = useRouter();
    const { authStore, gridStore, currencyStore } = useRootStore();
    const isAuthenticated = authStore.isAuthenticated;

    const handleShowHint = () => {
        gridStore.showHint();
    };

    const handleReset = () => {
        gridStore.reset();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Приказы</Text>
                <View style={styles.coinsContainer}>
                    <AppIcon name="coin" size={20} color="#f8d9a0" secondaryColor="#7b4f1d" />
                    <Text style={styles.coinsText}>{currencyStore.coins}</Text>
                </View>
            </View>
            
            <View style={styles.quickActions}>
                <Pressable
                    onPress={handleShowHint}
                    hitSlop={10}
                    style={({ pressed }) => [
                        styles.quickButton,
                        pressed && styles.quickButtonPressed,
                    ]}
                >
                    <AppIcon name="sparkles" size={20} color="#f8d9a0" secondaryColor="#b6946c" />
                    <Text style={styles.quickButtonText}>Подсказка</Text>
                </Pressable>
                <Pressable
                    onPress={handleReset}
                    hitSlop={10}
                    style={({ pressed }) => [
                        styles.quickButton,
                        styles.quickButtonDanger,
                        pressed && styles.quickButtonPressed,
                    ]}
                >
                    <AppIcon name="flame" size={20} color="#ff6b6b" secondaryColor="#c92a2a" />
                    <Text style={[styles.quickButtonText, styles.quickButtonTextDanger]}>Сброс</Text>
                </Pressable>
            </View>

            <Pressable
                onPress={() => router.push('/(tabs)/explore')}
                style={({ pressed }) => [
                    styles.commandButton,
                    pressed && styles.commandButtonPressed,
                ]}
            >
                <View style={styles.iconBadge}>
                    <AppIcon name="scroll" size={28} color="#f8d9a0" secondaryColor="#b6946c" />
                </View>
                <View style={styles.commandCopy}>
                    <Text style={styles.commandTitle}>Башня улучшений</Text>
                    <Text style={styles.commandSubtitle}>Усильте союзников и казну.</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color="#fbead4" />
            </Pressable>
            <Pressable
                onPress={() => router.push('/(tabs)/leaderboard')}
                style={({ pressed }) => [
                    styles.commandButton,
                    pressed && styles.commandButtonPressed,
                ]}
            >
                <View style={styles.iconBadge}>
                    <AppIcon name="trophy" size={28} color="#f8d9a0" secondaryColor="#f5c16c" />
                </View>
                <View style={styles.commandCopy}>
                    <Text style={styles.commandTitle}>Лига героев</Text>
                    <Text style={styles.commandSubtitle}>
                        {isAuthenticated ? 'Ваше место в хрониках.' : 'Войдите для синхронизации.'}
                    </Text>
                </View>
                <AppIcon name="chevron-right" size={20} color="#fbead4" />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2f1f13',
        borderRadius: 10,
        padding: 15,
        elevation: 4,
        shadowColor: '#1a0f06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fbead4',
    },
    coinsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3f2410',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    coinsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f8d9a0',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    quickButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3f2410',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
    },
    quickButtonDanger: {
        backgroundColor: '#3f1a1a',
    },
    quickButtonPressed: {
        opacity: 0.8,
    },
    quickButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8d9a0',
    },
    quickButtonTextDanger: {
        color: '#ff8a8a',
    },
    commandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5c3412',
        borderRadius: 12,
        padding: 14,
        gap: 14,
        marginTop: 8,
        elevation: 2,
        shadowColor: '#1a0f06',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    commandButtonPressed: {
        opacity: 0.88,
        elevation: 1,
    },
    iconBadge: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#3f2410',
        justifyContent: 'center',
        alignItems: 'center',
    },
    commandCopy: {
        flex: 1,
        gap: 4,
    },
    commandTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fbead4',
    },
    commandSubtitle: {
        fontSize: 13,
        color: '#d9c3a0',
    },
});

export default observer(ActionMenu);
