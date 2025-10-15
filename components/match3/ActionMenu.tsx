import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSessionContext } from '../../contexts/GameSessionContext';
import { RootStoreContext } from '../../store/RootStore';
import SessionHistory from './SessionHistory';

const ActionMenu: React.FC = () => {
    const rootStore = useContext(RootStoreContext);
    const { reset } = rootStore.gridStore;
    const { startNewSession } = useGameSessionContext();
    const [showHistory, setShowHistory] = useState(false);

    const handleReset = async () => {
        reset();
        await startNewSession();
    };

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Actions</Text>
                <View style={styles.buttonContainer}>
                    <Pressable
                        onPress={handleReset}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed
                        ]}
                    >
                        <Ionicons name="refresh" size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                        onPress={() => setShowHistory(true)}
                        style={({ pressed }) => [
                            styles.button,
                            styles.buttonHistory,
                            pressed && styles.buttonPressed
                        ]}
                    >
                        <Ionicons name="time-outline" size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                        style={[styles.button, styles.buttonDisabled]}
                        disabled={true}
                    >
                        <Ionicons name="bulb" size={24} color="#999" />
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={showHistory}
                animationType="slide"
                onRequestClose={() => setShowHistory(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Pressable 
                            onPress={() => setShowHistory(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="#333" />
                        </Pressable>
                    </View>
                    <SessionHistory />
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    buttonHistory: {
        backgroundColor: '#9C27B0',
    },
    buttonPressed: {
        opacity: 0.7,
        elevation: 1,
    },
    buttonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        padding: 5,
    },
});

export default ActionMenu;
