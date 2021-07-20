import DiscChannel from '../discord/DiscChannel';
import GizzzStatus from './GizzzStatus';
import GizzzType from './GizzzType';
import SquadMember from './SquadMember';

export default class Gizzz {
    constructor(
        private _status: GizzzStatus,
        private _owner: SquadMember,
        private _channel: DiscChannel,
        private target: number,
        private _squad: { member: SquadMember; hasJoined: boolean }[],
        private others: SquadMember[],
        private _id?: string,
        private audience?: SquadMember[],
    ) {
        if (_squad.length === 0) {
            // initialize only when the Gizzz is created (i.e. first instantiation)
            this._status = GizzzStatus.Pending;
            this.addSquadMember(this._owner);
        }
    }

    get gap(): number {
        return this.target - this._squad.length;
    }
    get owner(): SquadMember {
        return this._owner;
    }

    get squad(): { member: SquadMember; hasJoined: boolean }[] {
        return this._squad;
    }

    get status(): GizzzStatus {
        return this._status;
    }

    set status(status: GizzzStatus) {
        this._status = status;
    }

    public isComplete(): boolean {
        return this._status === GizzzStatus.Complete;
    }

    public serialize(): GizzzType {
        return {
            _id: this._id,
            status: this._status,
            owner: this._owner,
            channel: this._channel,
            target: this.target,
            audience: this.audience,
            squad: this._squad,
            others: this.others,
        };
    }

    public isInAudience(user: SquadMember): boolean {
        return (
            this.audience === undefined ||
            this.audience.length === 0 ||
            this.audience.find((u) => u.id === user.id) !== undefined
        );
    }

    public isSquadMember(member: SquadMember): boolean {
        return this._squad.find((u) => u.member.id === member.id) !== undefined;
    }

    public addSquadMember(member: SquadMember): void {
        let hasJoined = false;
        if (this.isOthersMember(member)) {
            hasJoined = true;
            this.removeOthersMember(member);
        }
        this._squad.push({ member, hasJoined });
        this.updateStatus();
    }

    public updateSquadMember(member: SquadMember, hasJoined: boolean): void {
        const i = this._squad.findIndex((m) => m.member.id === member.id);
        this._squad[i] = { member, hasJoined };
        this.updateStatus();
    }

    public removeSquadMember(member: SquadMember): void {
        if (this._squad.find((m) => m.member.id === member.id)?.hasJoined) {
            this.addOthersMember(member);
        }
        this._squad = this._squad.filter((e) => e.member.id !== member.id);
    }

    public addOthersMember(member: SquadMember): void {
        this.others.push(member);
    }

    public removeOthersMember(member: SquadMember): void {
        this.others = this.others.filter((e) => e.id !== member.id);
    }

    private updateStatus(): void {
        if (
            this.isSquadMember(this._owner) &&
            this._squad.length === this.target &&
            this._squad.find((m) => m.hasJoined === false) === undefined
        ) {
            this._status = GizzzStatus.Complete;
        }
    }
    private isOthersMember(member: SquadMember): boolean {
        return this.others.find((m) => m.id === member.id) !== undefined;
    }
}
