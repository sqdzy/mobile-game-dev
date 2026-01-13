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
    const hintCells = info.hintCells;

    const isHintedCell = (x: number, y: number): boolean => {
        if (!hintCells) return false;
        return (
            (hintCells.from.x === x && hintCells.from.y === y) ||
            (hintCells.to.x === x && hintCells.to.y === y)
        );
    };

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
                                isHinted={isHintedCell(cellInfo.x, cellInfo.y)}
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
        backgroundColor: '#1f120a',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#1a0f06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
    },
});

export default observer(GameGrid);
