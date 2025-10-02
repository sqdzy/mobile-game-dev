import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RootStoreContext } from '../../store/RootStore';

const StatsCard: React.FC = () => {
    const rootStore = useContext(RootStoreContext);
    const { info } = rootStore.statStore;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Puzzle</Text>
                    <Text style={styles.statText}>Blue count: {info.blueCount}</Text>
                    <Text style={styles.statText}>Red count: {info.redCount}</Text>
                    <Text style={styles.statText}>Green count: {info.greenCount}</Text>
                    <Text style={styles.statText}>Purple count: {info.purpleCount}</Text>
                    <Text style={styles.statText}>Amber count: {info.amberCount}</Text>
                    <Text style={styles.statText}>Grey count: {info.greyCount}</Text>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Matches</Text>
                    <Text style={styles.statText}>Match-3: {info.match3}</Text>
                    <Text style={styles.statText}>Match-4: {info.match4}</Text>
                    <Text style={styles.statText}>Match-5: {info.match5}</Text>
                    <Text style={styles.statText}>Blue: {info.blue}</Text>
                    <Text style={styles.statText}>Red: {info.red}</Text>
                    <Text style={styles.statText}>Green: {info.green}</Text>
                    <Text style={styles.statText}>Purple: {info.purple}</Text>
                    <Text style={styles.statText}>Amber: {info.amber}</Text>
                    <Text style={styles.statText}>Grey: {info.grey}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        maxHeight: 300,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    statText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
});

export default observer(StatsCard);
