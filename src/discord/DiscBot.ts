import Discord, { Channel, VoiceChannel } from 'discord.js';
import { discordEventListener } from '../gizzz/gizzzHandler';
import DiscChannel from './DiscChannel';

export default class DiscBot {
    private client = new Discord.Client();

    constructor() {
        this.client.login(process.env.DISC_TOKEN);

        this.client.on('ready', () => {
            console.log('DiscBot login successful');
        });

        //https://discord.js.org/#/docs/main/master/class/VoiceState
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            /*
            cases to cover:
            - connect straight to channel: oldState undefined
            - disconnect from channel: newState undefined
            - switch channel: old and new defined
            cases to ignore:
            - mute/unmute: old channel === new channel
            */
            if (oldState.channelID !== newState.channelID) {
                const oldC = oldState.channelID
                    ? { server: oldState.guild.id, channel: oldState.channelID }
                    : undefined;
                const newC = newState.channelID
                    ? { server: newState.guild.id, channel: newState.channelID }
                    : undefined;

                const memberId =
                    oldState.member !== null && oldState.member.id ? oldState.member.id : newState?.member?.id;

                if (memberId) {
                    discordEventListener({
                        user: memberId,
                        oldChannel: oldC,
                        newChannel: newC,
                    });
                }
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

    public getUserIdsByChannel(channelId: DiscChannel): string[] {
        const voiceStates = this.client.guilds.cache
            .get(channelId.server)
            ?.voiceStates.cache.filter((vs) => vs.channelID === channelId.channel);

        return voiceStates?.map((vs) => vs.id) || [];
    }

    public getUserDisplayName(id: string): string | undefined {
        return this.client.users.cache.get(id)?.tag;
    }
}
