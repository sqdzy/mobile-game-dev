export type UpgradeId =
    | 'royal-ledger'
    | 'guild-patrons'
    | 'battle-horns'
    | 'chronomancer-hourglass'
    | 'dragon-siege'
    | 'architects-council';

export type UpgradeEffectType =
    | 'coinMultiplier'
    | 'comboFlatBonus'
    | 'animationSpeed'
    | 'flatReward'
    | 'blastChance'
    | 'discount';

export interface UpgradeDefinition {
    id: UpgradeId;
    title: string;
    description: string;
    heroIcon: string;
    baseCost: number;
    costGrowth: number;
    maxLevel: number;
    effectType: UpgradeEffectType;
    valuePerLevel: number;
    previewVideo: string;
}

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
    {
        id: 'royal-ledger',
        title: 'Королевская казна',
        description: 'Сборщики десятин и счётные палаты усиливают каждое совпадение дополнительными монетами.',
        heroIcon: 'coin-purse',
        baseCost: 80,
        costGrowth: 1.55,
        maxLevel: 5,
        effectType: 'coinMultiplier',
        valuePerLevel: 0.15,
        previewVideo: 'https://cdn.pixabay.com/vimeo/210995075/castle-10892.mp4?width=640&hash=b923cd78c84fda8da12822ebed86d24c63435b83',
    },
    {
        id: 'guild-patrons',
        title: 'Гильдейские покровители',
        description: 'Меценаты подпитывают поле серебром, добавляя фиксированную награду за каждую добычу.',
        heroIcon: 'artisan-hammer',
        baseCost: 110,
        costGrowth: 1.65,
        maxLevel: 4,
        effectType: 'flatReward',
        valuePerLevel: 2,
        previewVideo: 'https://cdn.pixabay.com/vimeo/321219447/medieval-23516.mp4?width=640&hash=7d4423d155fc7938ffd1dc80ed2d5feab2f5923c',
    },
    {
        id: 'battle-horns',
        title: 'Боевые рога',
        description: 'Синхронный клич дружины усиливает каждую комбо-цепочку дополнительным золотом.',
        heroIcon: 'horn',
        baseCost: 130,
        costGrowth: 1.7,
        maxLevel: 4,
        effectType: 'comboFlatBonus',
        valuePerLevel: 3,
        previewVideo: 'https://cdn.pixabay.com/vimeo/403260466/battle-42675.mp4?width=640&hash=a7c9f29892ed6d5e70ea90aa62a034d5ccd768ef',
    },
    {
        id: 'chronomancer-hourglass',
        title: 'Песочные часы хрономага',
        description: 'Маги времени ускоряют перетекание рун, сокращая задержки падения и отработки анимаций.',
        heroIcon: 'hourglass',
        baseCost: 150,
        costGrowth: 1.8,
        maxLevel: 6,
        effectType: 'animationSpeed',
        valuePerLevel: 30,
        previewVideo: 'https://cdn.pixabay.com/vimeo/490607151/clock-61045.mp4?width=640&hash=f2b659398bea2b3c9c7de7c263f133faec5449bf',
    },
    {
        id: 'dragon-siege',
        title: 'Драконья осада',
        description: 'Призывает дракона, который изредка выжигает область поля, освобождая место для новых камней и наград.',
        heroIcon: 'dragon-fire',
        baseCost: 180,
        costGrowth: 1.85,
        maxLevel: 3,
        effectType: 'blastChance',
        valuePerLevel: 0.08,
        previewVideo: 'https://cdn.pixabay.com/vimeo/693089315/fire-74945.mp4?width=640&hash=a58c8877e4fda6c2db1d3c5c8d1d60d39d7ca3a4',
    },
    {
        id: 'architects-council',
        title: 'Совет архитекторов',
        description: 'Мастера строят изящные мастерские, снижая стоимость последующих улучшений.',
        heroIcon: 'tower',
        baseCost: 140,
        costGrowth: 1.6,
        maxLevel: 4,
        effectType: 'discount',
        valuePerLevel: 0.05,
        previewVideo: 'https://cdn.pixabay.com/vimeo/210995077/medieval-12093.mp4?width=640&hash=6bde5f03269d7a82c65a95d3d3f194541fba5c50',
    },
];

export const PURCHASE_SOUND: number = require('../assets/audio/main.mp3');
