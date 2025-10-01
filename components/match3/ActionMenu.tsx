import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStoreContext } from '../../store/RootStore';

const ActionMenu: React.FC = () => {
    const rootStore = useContext(RootStoreContext);
    const { reset } = rootStore.gridStore;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Actions</Text>
            <View style={styles.buttonContainer}>
                <Pressable
                    onPress={reset}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                >
                    <Ionicons name="refresh" size={24} color="#fff" />
                </Pressable>
                <Pressable
                    style={[styles.button, styles.buttonDisabled]}
                    disabled={true}
                >
                    <Ionicons name="bulb" size={24} color="#999" />
                </Pressable>
            </View>
        </View>
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
    buttonPressed: {
        opacity: 0.7,
        elevation: 1,
    },
    buttonDisabled: {
        backgroundColor: '#e0e0e0',
    },
});

export default ActionMenu;
