import { makeId } from "../utils/IdUtils";

export default class Message {
    id: string;
    date: Date;
    message: string;

    constructor(message: string) {
        this.id = makeId(10);
        this.date = new Date();
        this.message = message;
    }

    toString(): string {
        const hours = this.date.getHours().toString().padStart(2, '0');
        const minutes = this.date.getMinutes().toString().padStart(2, '0');
        const seconds = this.date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds} : ${this.message}`;
    }
}
