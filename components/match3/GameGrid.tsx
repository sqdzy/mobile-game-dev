import { observer } from 'mobx-react-lite';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useRootStore } from '../../store/RootStore';
import RoundCell from './RoundCell';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = Math.min(SCREEN_W * 0.9, 400);

const GameGrid: React.FC = () => {
    const rootStore = useRootStore();
    const { info, select } = rootStore.gridStore;

    return (
        <View style={styles.container}>
            <View style={[styles.gridContainer, { width: GRID_SIZE, height: GRID_SIZE }]}>
                {info.grid.cells.map((cellInfo) => {
                    if (cellInfo !== null) {
                        return (
                            <RoundCell
                                key={cellInfo.id}
                                backgroundColor={cellInfo.backgroundColor}
                                color={cellInfo.color}
                                selected={cellInfo.selected || false}
                                x={cellInfo.x}
                                y={cellInfo.y}
                                top={cellInfo.top}
                                left={cellInfo.left}
                                zIndex={cellInfo.zIndex}
                                icon={cellInfo.icon}
                                select={select}
                            />
                        );
                    }
                    return null;
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    gridContainer: {
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});

export default observer(GameGrid);
