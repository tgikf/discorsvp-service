import Discord, { Channel, VoiceChannel } from 'discord.js';
import { processGizzzEvent } from '../controllers/gizzzController';

export default class DiscBot {
    private client = new Discord.Client();

    constructor() {
        this.client.login(process.env.DISC_TOKEN);

        this.client.on('ready', () => {
            console.log('DiscBot login successful');
        });

        //https://discord.js.org/#/docs/main/master/class/VoiceState
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (
                newState.channelID &&
                oldState.channelID &&
                newState.member &&
                newState.channelID !== oldState.channelID
            ) {
                processGizzzEvent({
                    user: newState.member.id,
                    oldChannel: {
                        server: oldState.guild.id,
                        channel: oldState.channelID,
                    },
                    newChannel: {
                        server: newState.guild.id,
                        channel: newState.channelID,
                    },
                });
            }
        });
    }

    public getAllChannelIds(): Map<string, string[]> {
        const isVoiceChannel = (c: Channel): c is VoiceChannel =>
            (c as VoiceChannel).guild !== undefined && (c as VoiceChannel).type === 'voice';

        const serverMap = new Map<string, string[]>();
        [...this.client.channels.cache].forEach((c) => {
            if (isVoiceChannel(c[1]) && !c[1].deleted) {
                const prev = serverMap.get(c[1].guild.id) || [];
                serverMap.set(c[1].guild.id, [...prev, c[1].id]);
            }
        });

        return serverMap;
    }

    public getUserDisplayName(id: string): string | undefined {
        return this.client.users.cache.get(id)?.tag;
    }
}
