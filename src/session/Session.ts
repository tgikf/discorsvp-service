import DiscChannel from '../discord/types/DiscChannel';
import SessionStatus from './types/SessionStatus';
import SerializedSession from './types/SerializedSession';
import DiscordUser from './types/DiscordUser';

export default class Session {
    constructor(
        private _status: SessionStatus,
        private _owner: DiscordUser,
        private _channel: DiscChannel,
        private _target: number,
        private _squad: { member: DiscordUser; hasConnected: boolean }[],
        private _others: DiscordUser[],
        private _audience: DiscordUser[] = [{ id: 'no', name: 'audience' }],
    ) {
        if (_squad.length === 0) {
            // initialize only when the Session is created (i.e. first instantiation)
            this._status = SessionStatus.Pending;
            this.addSquadMember(this._owner);
        }
    }

    get gap(): number {
        return this._target - this._squad.length;
    }

    get owner(): DiscordUser {
        return this._owner;
    }

    get squad(): { member: DiscordUser; hasConnected: boolean }[] {
        return this._squad;
    }

    get status(): SessionStatus {
        return this._status;
    }

    set status(status: SessionStatus) {
        this._status = status;
    }

    public isComplete(): boolean {
        return this._status === SessionStatus.Complete;
    }

    public isPending(): boolean {
        return this._status === SessionStatus.Pending;
    }

    public serialize(): SerializedSession {
        return {
            status: this._status,
            owner: this._owner,
            channel: this._channel,
            target: this._target,
            audience: this._audience,
            squad: this._squad,
            others: this._others,
        };
    }

    public isInAudience(user: DiscordUser): boolean {
        return (
            this._audience === undefined ||
            this._audience.length === 0 ||
            this._audience.find((u) => u.id === user.id) !== undefined
        );
    }

    public isSquadMember(member: DiscordUser): boolean {
        return this._squad.find((u) => u.member.id === member.id) !== undefined;
    }

    public addSquadMember(member: DiscordUser): void {
        let hasConnected = false;
        if (this.isOthersMember(member)) {
            hasConnected = true;
            this.removeOthersMember(member);
        }
        this._squad.push({ member, hasConnected });
        this.updateStatus();
    }

    public updateSquadMember(member: DiscordUser, hasConnected: boolean): void {
        const i = this._squad.findIndex((m) => m.member.id === member.id);
        this._squad[i] = { member, hasConnected };
        this.updateStatus();
    }

    public removeSquadMember(member: DiscordUser): void {
        if (this._squad.find((m) => m.member.id === member.id)?.hasConnected) {
            this.addOthersMember(member);
        }
        this._squad = this._squad.filter((e) => e.member.id !== member.id);
    }

    public addOthersMember(member: DiscordUser): void {
        this._others.push(member);
    }

    public removeOthersMember(member: DiscordUser): void {
        this._others = this._others.filter((e) => e.id !== member.id);
    }

    private updateStatus(): void {
        if (
            this.isSquadMember(this._owner) &&
            this._squad.length === this._target &&
            this._squad.find((m) => m.hasConnected === false) === undefined
        ) {
            this._status = SessionStatus.Complete;
        }
    }

    private isOthersMember(member: DiscordUser): boolean {
        return this._others.find((m) => m.id === member.id) !== undefined;
    }
}
