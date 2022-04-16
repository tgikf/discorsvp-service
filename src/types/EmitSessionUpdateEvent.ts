import Session from '../session/Session';
import DiscordUser from '../session/types/DiscordUser';

export enum SessionEventType {
    Create,
    Join,
    Leave,
    Connect,
    Disconnect,
    Cancel,
    Complete,
    None,
}

export type EmitSessionUpdateEvent = (
    user: DiscordUser,
    sessionId: string,
    session: Session,
    eventType: SessionEventType,
) => void;
