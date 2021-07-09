import DiscChannel from './DiscChannel';

type DiscEvent = {
    user: string;
    oldChannel: DiscChannel;
    newChannel: DiscChannel | undefined;
};

export default DiscEvent;
