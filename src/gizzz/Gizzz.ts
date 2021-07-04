import DiscChannel from '../discord/DiscChannel';

export default class Gizzz {
    private squad: { member: string; hasJoined: boolean }[] = [];
    private others: string[] = []; //array to store people who join the channel without accepting (in case they join first and accept later)

    constructor(
        private _owner: string,
        private _channel: DiscChannel,
        private target: number,
        private audience?: string[],
    ) {}

    get owner(): string {
        return this._owner;
    }

    get channel(): DiscChannel {
        return this._channel;
    }

    public processEvent(join: boolean, channel: DiscChannel, user: string): void {
        if (join) {
            if (join && !this.isComplete && this.isInAudience(user) && this.channel === channel) {
                this.addSquadMember(user);
            } else {
                this.addOthersMember(user);
            }
        } else {
            if (!join && this.isSquadMember(user)) {
                this.removeSquadMember(user);
            } else {
                this.remmoveOthersMember(user);
            }
        }
        if (this.isComplete()) {
            console.log('Gizzz completed!', this);
        }
    }

    public isComplete(): boolean {
        return (
            this.isSquadMember(this.owner) &&
            this.squad.length === this.target &&
            this.squad.find((m) => m.hasJoined === false) === undefined
        );
    }

    private isInAudience(user: string): boolean {
        return this.audience === undefined || this.audience.indexOf(user) >= 0;
    }

    private isSquadMember(member: string): boolean {
        return this.squad.find((u) => u.member === member) !== undefined;
    }

    private addSquadMember(member: string): void {
        this.squad.push({ member, hasJoined: false });
    }

    private removeSquadMember(member: string): void {
        this.squad = this.squad.filter((e) => e.member !== member);
    }

    private isOthersMember(member: string): boolean {
        return this.others.find((m) => m === member) !== undefined;
    }
    private addOthersMember(member: string): void {
        this.others.push(member);
    }

    private remmoveOthersMember(member: string): void {
        this.others = this.others.filter((e) => e !== member);
    }
}
