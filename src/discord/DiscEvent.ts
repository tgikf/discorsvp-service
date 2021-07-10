import DiscChannel from './DiscChannel';

type DiscEvent = {
    user: string;
    oldChannel: DiscChannel | undefined;
    newChannel: DiscChannel | undefined;
};

export default DiscEvent;
