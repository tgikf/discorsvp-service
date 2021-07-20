import DiscChannel from '../discord/DiscChannel';
import GizzzStatus from './GizzzStatus';
import SquadMember from './SquadMember';

type GizzzType = {
    _id?: string;
    status: GizzzStatus;
    owner: SquadMember;
    channel: DiscChannel;
    target: number;
    audience?: SquadMember[];
    squad: { member: SquadMember; hasJoined: boolean }[];
    others: SquadMember[];
};

export default GizzzType;
