import DiscChannel from '../../discord/types/DiscChannel';
import SessionStatus from './SessionStatus';
import DiscordUser from './DiscordUser';

type SerializedSession = {
    id?: string;
    status: SessionStatus;
    owner: DiscordUser;
    channel: DiscChannel;
    target: number;
    audience?: DiscordUser[];
    squad: { member: DiscordUser; hasJoined: boolean }[];
    others: DiscordUser[];
};

export default SerializedSession;
