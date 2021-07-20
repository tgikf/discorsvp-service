import Discord, { Channel, VoiceChannel } from 'discord.js';
import { discordEventListener } from '../gizzz/gizzzHandler';
import SquadMember from '../gizzz/SquadMember';
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
                    ? { server: { id: oldState.guild.id }, channel: { id: oldState.channelID } }
                    : undefined;
                const newC = newState.channelID
                    ? { server: { id: newState.guild.id }, channel: { id: newState.channelID } }
                    : undefined;

                const memberId =
                    oldState.member !== null && oldState.member.id ? oldState.member.id : newState?.member?.id;

                const memberName =
                    oldState.member !== null && oldState.member.user.username
                        ? oldState.member.user.username
                        : newState?.member?.user.username;

                if (memberId && memberName) {
                    discordEventListener({
                        user: { id: memberId, name: memberName },
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

    public getUserIdsByChannel(channelId: DiscChannel): SquadMember[] {
        const voiceStates = this.client.guilds.cache
            .get(channelId.server.id)
            ?.voiceStates.cache.filter((vs) => vs.channelID === channelId.channel.id);

        return (
            voiceStates?.map((vs) => {
                return { id: vs.id, name: vs.member?.user.username ? vs.member.user.username : '' };
            }) || []
        );
    }

    public getUserDisplayName(id: string): string | undefined {
        return this.client.users.cache.get(id)?.tag;
    }
}
