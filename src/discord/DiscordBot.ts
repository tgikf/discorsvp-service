import Discord, { Channel, VoiceChannel } from 'discord.js';
import { updateOnDiscordEvent } from '../session/sessionHandler';
import DiscordUser from '../session/types/DiscordUser';
import DiscChannel from './types/DiscChannel';

export default class DiscordBot {
    private client = new Discord.Client();

    constructor() {
        this.client.login(process.env.DISC_TOKEN);

        this.client.on('ready', () => {
            console.log('DiscBot login successful');
        });

        // https://discord.js.org/#/docs/main/master/class/VoiceState
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
                const oldChannel = oldState.channelID
                    ? { server: { id: oldState.guild.id }, channel: { id: oldState.channelID } }
                    : undefined;
                const newChannel = newState.channelID
                    ? { server: { id: newState.guild.id }, channel: { id: newState.channelID } }
                    : undefined;

                const memberId =
                    oldState.member !== null && oldState.member.id ? oldState.member.id : newState?.member?.id;

                const memberName =
                    oldState.member !== null && oldState.member.user.username
                        ? oldState.member.user.username
                        : newState?.member?.user.username;

                if (memberId && memberName) {
                    const user = { id: memberId, name: memberName };
                    console.log(
                        `User ${memberName} moved from ${JSON.stringify(oldChannel)} to ${JSON.stringify(newChannel)}}`,
                    );
                    if (oldChannel) {
                        updateOnDiscordEvent(false, oldChannel, user);
                    }
                    if (newChannel) {
                        updateOnDiscordEvent(true, newChannel, user);
                    }
                }
            }
        });
    }

    public getAllChannelIds(): DiscChannel[] {
        const isVoiceChannel = (c: Channel): c is VoiceChannel =>
            (c as VoiceChannel).guild !== undefined && (c as VoiceChannel).type === 'voice';
        const channelList: DiscChannel[] = [];
        [...this.client.channels.cache].forEach((c) => {
            if (isVoiceChannel(c[1]) && !c[1].deleted) {
                channelList.push({
                    server: { id: c[1].guild.id, name: c[1].guild.name },
                    channel: { id: c[1].id, name: c[1].name },
                });
            }
        });

        return channelList;
    }

    public getUserIdsByChannel(channel: DiscChannel): DiscordUser[] {
        const voiceStates = this.client.guilds.cache
            .get(channel.server.id)
            ?.voiceStates.cache.filter((vs) => vs.channelID === channel.channel.id);

        return (
            voiceStates?.map((vs) => ({ id: vs.id, name: vs.member?.user.username ? vs.member.user.username : '' })) ||
            []
        );
    }

    public async getUserDisplayName(id: string): Promise<string> {
        return (await this.client.users.fetch(id)).username;
    }

    public async getServerDisplayName(id: string): Promise<string> {
        return (await this.client.guilds.fetch(id)).name;
    }

    public async getChannelDisplayName(id: string): Promise<string> {
        return ((await this.client.channels.fetch(id)) as VoiceChannel).name;
    }
}
