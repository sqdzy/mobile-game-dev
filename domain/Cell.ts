import { makeObservable, observable } from "mobx";
import { makeId } from "../utils/IdUtils";

// Color definitions for React Native (using standard color values)
export const blueCell = {
    name: 'blue',
    backgroundColor: '#2196F3',
    color: '#1565C0',
    icon: 'water'
};

export const redCell = {
    name: 'red',
    backgroundColor: '#F44336',
    color: '#FFEB3B',
    icon: 'flame'
};

export const greenCell = {
    name: 'green',
    backgroundColor: '#4CAF50',
    color: '#795548',
    icon: 'leaf'
};

export const purpleCell = {
    name: 'purple',
    backgroundColor: '#9C27B0',
    color: '#CDDC39',
    icon: 'sparkles'
};

export const amberCell = {
    name: 'amber',
    backgroundColor: '#FFC107',
    color: '#4CAF50',
    icon: 'bug'
};

export const greyCell = {
    name: 'grey',
    backgroundColor: '#607D8B',
    color: '#FFA000',
    icon: 'extension-puzzle'
};

export interface CellPart {
    name: string;
    backgroundColor: string;
    color: string;
    icon: string;
}

export interface CellInfo extends CellPart {
    id: string;
    x: number;
    y: number;
    zIndex: number;
    selected: boolean;
    canBeSelected: boolean;
    top: number;
    left: number;
}

export default class Cell implements CellInfo {
    id: string;
    x: number;
    y: number;
    zIndex: number;
    selected: boolean;
    canBeSelected: boolean;
    top: number;
    left: number;
    name: string = 'white';
    backgroundColor: string = 'white';
    color: string = 'black';
    icon: string = 'extension-puzzle';

    constructor(x: number, y: number, squareSize: number, color?: string) {
        this.id = makeId(10);
        this.x = x;
        this.y = y;
        this.selected = false;
        this.canBeSelected = false;
        this.top = ((squareSize - 1) - y) * 12.5;
        this.left = x * 12.5;
        this.zIndex = (squareSize - 1) - y;
        
        if (color) {
            this.setColor(color);
        }

        makeObservable(this, {
            id: observable,
            x: observable,
            y: observable,
            zIndex: observable,
            selected: observable,
            canBeSelected: observable,
            top: observable,
            left: observable,
            name: observable,
            backgroundColor: observable,
            color: observable,
            icon: observable,
        });
    }

    copy(cell: Cell): Cell {
        this.id = cell.id;
        this.x = cell.x;
        this.y = cell.y;
        this.selected = cell.selected;
        this.canBeSelected = cell.canBeSelected;
        this.top = cell.top;
        this.left = cell.left;
        this.zIndex = cell.zIndex;
        this.name = cell.name;
        this.backgroundColor = cell.backgroundColor;
        this.color = cell.color;
        this.icon = cell.icon;
        return this;
    }

    setColor(color: string): void {
        let data: CellPart | null = null;
        switch (color) {
            case 'blue':
                data = { ...blueCell };
                break;
            case 'red':
                data = { ...redCell };
                break;
            case 'green':
                data = { ...greenCell };
                break;
            case 'purple':
                data = { ...purpleCell };
                break;
            case 'amber':
                data = { ...amberCell };
                break;
            case 'grey':
                data = { ...greyCell };
                break;
        }
        if (data !== null) {
            this.name = data.name;
            this.backgroundColor = data.backgroundColor;
            this.color = data.color;
            this.icon = data.icon;
        }
    }

    setPosition(x: number, y: number, squareSize: number): void {
        this.x = x;
        this.y = y;
        this.top = ((squareSize - 1) - y) * 12.5;
        this.left = x * 12.5;
        this.zIndex = (squareSize - 1) - y;
        this.selected = false;
        this.canBeSelected = false;
    }

    setData(name: string, backgroundColor: string, color: string, icon: string): void {
        this.name = name;
        this.backgroundColor = backgroundColor;
        this.color = color;
        this.icon = icon;
    }
}
