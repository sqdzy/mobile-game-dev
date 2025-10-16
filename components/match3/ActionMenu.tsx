import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MedievalIcon } from '../ui/MedievalIcon';

const ActionMenu: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Приказы</Text>
            <Pressable
                onPress={() => router.push('/(tabs)/explore')}
                style={({ pressed }) => [
                    styles.commandButton,
                    pressed && styles.commandButtonPressed,
                ]}
            >
                <View style={styles.iconBadge}>
                    <MedievalIcon name="upgrade-scroll" size={32} color="#f8d9a0" accentColor="#7b4f1d" />
                </View>
                <View style={styles.commandCopy}>
                    <Text style={styles.commandTitle}>Башня улучшений</Text>
                    <Text style={styles.commandSubtitle}>Откройте чертоги мастеров, чтобы усилить союзников и казну.</Text>
                </View>
                <Text style={styles.commandArrow}>&gt;</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2f1f13',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#1a0f06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fbead4',
    },
    commandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5c3412',
        borderRadius: 12,
        padding: 14,
        gap: 14,
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
    commandArrow: {
        fontSize: 20,
        color: '#fbead4',
        fontWeight: '700',
    },
});

export default ActionMenu;
