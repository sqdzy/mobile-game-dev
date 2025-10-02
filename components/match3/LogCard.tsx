import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Message from '../../domain/Message';
import { RootStoreContext } from '../../store/RootStore';

const LogCard: React.FC = () => {
    const rootStore = useContext(RootStoreContext);
    const { allMessages } = rootStore.messageStore;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log</Text>
            <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={true}>
                {allMessages.map((m: Message) => (
                    <Text key={m.id} style={styles.logText}>
                        {m.toString()}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        height: 300,
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
    logScroll: {
        flex: 1,
    },
    logText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
});

export default observer(LogCard);
