import DiscChannel from './DiscChannel';

type DiscEvent = {
    user: { id: string; name: string };
    oldChannel: DiscChannel | undefined;
    newChannel: DiscChannel | undefined;
};

export default DiscEvent;
