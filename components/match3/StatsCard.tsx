import { observer } from 'mobx-react-lite';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRootStore } from '../../store/RootStore';
import type { UpgradeSnapshot } from '../../store/UpgradeStore';

const StatsCard: React.FC = () => {
    const rootStore = useRootStore();
    const { info } = rootStore.statStore;
    const { coins, isLoaded } = rootStore.currencyStore;
    const upgradeStore = rootStore.upgradeStore;
    const upgradeCatalog: UpgradeSnapshot[] = upgradeStore.catalog;
    const {
        coinRewardMultiplier,
        comboBonusCoins,
        flatRewardBonus,
        blastChance,
        upgradeDiscount,
        animationReduction,
    } = upgradeStore;
    const purchasedUpgrades = upgradeCatalog.filter((upgrade: UpgradeSnapshot) => upgrade.level > 0);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Казна</Text>
                    <Text style={styles.statText}>Монеты: {isLoaded ? coins : '...'}</Text>
                    <Text style={styles.statText}>Множитель десятины: x{coinRewardMultiplier.toFixed(2)}</Text>
                    <Text style={styles.statText}>Покровители: +{flatRewardBonus} монет за добычу</Text>
                    <Text style={styles.statText}>Боевые рога: +{comboBonusCoins} монет за комбо</Text>
                    {blastChance > 0 ? (
                        <Text style={styles.statText}>
                            Драконья осада: {Math.round(blastChance * 100)}% шанс залпа
                        </Text>
                    ) : null}
                    {upgradeDiscount > 0 ? (
                        <Text style={styles.statText}>
                            Совет архитекторов: -{Math.round(upgradeDiscount * 100)}% к стоимости
                        </Text>
                    ) : null}
                    {animationReduction > 0 ? (
                        <Text style={styles.statText}>
                            Песочные часы: -{animationReduction} мс к ритуалам
                        </Text>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Руна-поле</Text>
                    <Text style={styles.statText}>Синие руны: {info.blueCount}</Text>
                    <Text style={styles.statText}>Алые руны: {info.redCount}</Text>
                    <Text style={styles.statText}>Изумрудные руны: {info.greenCount}</Text>
                    <Text style={styles.statText}>Аметистовые руны: {info.purpleCount}</Text>
                    <Text style={styles.statText}>Янтарные руны: {info.amberCount}</Text>
                    <Text style={styles.statText}>Каменные руны: {info.greyCount}</Text>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Победы</Text>
                    <Text style={styles.statText}>Связи из трёх: {info.match3}</Text>
                    <Text style={styles.statText}>Связи из четырёх: {info.match4}</Text>
                    <Text style={styles.statText}>Связи из пяти: {info.match5}</Text>
                    <Text style={styles.statText}>Синих трофеев: {info.blue}</Text>
                    <Text style={styles.statText}>Алых трофеев: {info.red}</Text>
                    <Text style={styles.statText}>Изумрудных трофеев: {info.green}</Text>
                    <Text style={styles.statText}>Аметистовых трофеев: {info.purple}</Text>
                    <Text style={styles.statText}>Янтарных трофеев: {info.amber}</Text>
                    <Text style={styles.statText}>Каменных трофеев: {info.grey}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Строения</Text>
                    {purchasedUpgrades.length === 0 ? (
                        <Text style={styles.statText}>Еще нет возведённых улучшений</Text>
                    ) : (
                        purchasedUpgrades.map((upgrade: UpgradeSnapshot) => (
                            <Text key={upgrade.id} style={styles.statText}>
                                {upgrade.title}: Lv.{upgrade.level}
                            </Text>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2f1f13',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        height: 360,
        elevation: 4,
        shadowColor: '#1a0f06',
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
        color: '#fbead4',
    },
    statText: {
        fontSize: 14,
        color: '#e4cfac',
        marginBottom: 4,
    },
});

export default observer(StatsCard);
