import DiscChannel from '../discord/DiscChannel';
import GizzzStatus from './GizzzStatus';
import GizzzType from './GizzzType';

export default class Gizzz {
    constructor(
        private _status: GizzzStatus,
        private _ownerId: string,
        private _channel: DiscChannel,
        private target: number,
        private _squad: { memberId: string; hasJoined: boolean }[],
        private others: string[],
        private _id?: string,
        private audience?: string[],
    ) {
        if (_squad.length === 0) {
            // initialize only when the Gizzz is created (i.e. first instantiation)
            this._status = GizzzStatus.Pending;
            this.addSquadMember(this._ownerId);
        }
    }

    get gap(): number {
        return this.target - this._squad.length;
    }
    get owner(): string {
        return this._ownerId;
    }

    get squad(): { memberId: string; hasJoined: boolean }[] {
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
            owner: this._ownerId,
            channel: this._channel,
            target: this.target,
            audience: this.audience,
            squad: this._squad,
            others: this.others,
        };
    }

    public isInAudience(userId: string): boolean {
        return (
            this.audience === undefined ||
            this.audience.length === 0 ||
            this.audience.find((u) => u === userId) !== undefined
        );
    }

    public isSquadMember(memberId: string): boolean {
        return this._squad.find((u) => u.memberId === memberId) !== undefined;
    }

    public addSquadMember(memberId: string): void {
        let hasJoined = false;
        if (this.isOthersMember(memberId)) {
            hasJoined = true;
            this.removeOthersMember(memberId);
        }
        this._squad.push({ memberId, hasJoined });
        this.updateStatus();
    }

    public updateSquadMember(memberId: string, hasJoined: boolean): void {
        const i = this._squad.findIndex((m) => m.memberId === memberId);
        this._squad[i] = { memberId, hasJoined };
        this.updateStatus();
    }

    public removeSquadMember(memberId: string): void {
        if (this._squad.find((m) => m.memberId === memberId)?.hasJoined) {
            this.addOthersMember(memberId);
        }
        this._squad = this._squad.filter((e) => e.memberId !== memberId);
    }

    public addOthersMember(memberId: string): void {
        this.others.push(memberId);
    }

    public removeOthersMember(memberId: string): void {
        this.others = this.others.filter((e) => e !== memberId);
    }

    private updateStatus(): void {
        if (
            this.isSquadMember(this.owner) &&
            this._squad.length === this.target &&
            this._squad.find((m) => m.hasJoined === false) === undefined
        ) {
            this._status = GizzzStatus.Complete;
        }
    }
    private isOthersMember(memberId: string): boolean {
        return this.others.find((m) => m === memberId) !== undefined;
    }
}
