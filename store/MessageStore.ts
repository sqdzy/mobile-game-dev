import { action, computed, makeObservable, observable } from "mobx";
import Match from "../domain/Match";
import Message from "../domain/Message";
import type { RootStore } from "./RootStore";

export default class MessageStore {
    messages: Message[] = [];
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        
        makeObservable(this, {
            messages: observable,
            allMessages: computed,
            add: action,
            addMatch: action,
        });
    }

    get allMessages() {
        return this.messages.slice().reverse();
    }

    add = (message: string) => {
        this.messages.push(new Message(message));
    };

    addMatch = (match: Match) => {
        const message = 'Match-' + (match.suite + 1) + " " + match.color + (match.isCombo ? ' COMBO' : '');
        this.messages.push(new Message(message));
    };
}
