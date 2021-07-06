import DiscChannel from '../discord/DiscChannel';
import GizzzStatus from './GizzzStatus';

type GizzzType = {
    status: GizzzStatus;
    owner: string;
    channel: DiscChannel;
    target: number;
    audience?: string[];
    squad: { memberId: string; hasJoined: boolean }[];
    others: string[];
};

export default GizzzType;
