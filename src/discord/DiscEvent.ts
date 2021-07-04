import DiscChannel from './DiscChannel';

type DiscEvent = {
    user: string;
    oldChannel: DiscChannel;
    newChannel: DiscChannel;
};

export default DiscEvent;
