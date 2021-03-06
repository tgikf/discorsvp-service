import Session from './Session';
import SessionStatus from './types/SessionStatus';

const shellChannel = {
    serverChannelId: 'abc',
    server: { id: 'someserver', name: 'someserver' },
    channel: { id: 'somechannel', name: 'somechannel' },
};
const shellOwner = { id: 'owner', name: 'owner' };
const shellMember = { id: 'member', name: 'member' };

describe('Session class', () => {
    it('initializes the first instance with the owner in the squad', () => {
        const g = new Session(SessionStatus.Pending, shellOwner, shellChannel, 4, [], []);
        expect(g.isSquadMember(g.owner));
    });

    it('adds a squad member that is not present in the channel', () => {
        const g = new Session(SessionStatus.Pending, shellOwner, shellChannel, 4, [], []);
        g.addSquadMember({ id: 'member', name: 'member' });
        expect(g.isSquadMember({ id: 'member', name: 'member' })).toBeTruthy();
    });

    it('adds a squad member that is present in the channel correctly and updates the status', () => {
        const g = new Session(SessionStatus.Pending, shellOwner, shellChannel, 2, [], [shellMember]);
        g.updateSquadMember(shellOwner, true);
        g.addSquadMember(shellMember);
        expect(g.status === SessionStatus.Complete).toBeTruthy();
    });

    it('updates a squad member upon joining the channel correctly and updates the status', () => {
        const g = new Session(SessionStatus.Pending, shellOwner, shellChannel, 2, [], []);
        g.updateSquadMember(shellOwner, true);
        g.addSquadMember(shellMember);
        expect(g.isComplete()).toBeFalsy();
        g.updateSquadMember(shellMember, true);
        expect(g.isComplete()).toBeTruthy();
    });

    it('removes a squad member correctly', () => {
        const g = new Session(
            SessionStatus.Pending,
            shellOwner,
            shellChannel,
            3,
            [
                { member: shellOwner, hasConnected: false },
                { member: { id: 'member3', name: 'member3' }, hasConnected: true },
                { member: { id: 'member4', name: 'member4' }, hasConnected: true },
            ],
            [],
        );
        g.removeSquadMember({ id: 'member3', name: 'member3' });
        expect(g.gap).toBe(1);
    });

    it('evaluates people included in undefined audience correctly', () => {
        const g = new Session(SessionStatus.Pending, shellOwner, shellChannel, 4, [], []);
        expect(g.isInAudience(shellMember)).toBeTruthy();
    });

    it('evaluates people included in defined audience correctly', () => {
        const g = new Session(
            SessionStatus.Pending,
            shellOwner,
            shellChannel,
            4,
            [],
            [],
            [
                { id: 'abc', name: 'abc' },
                { id: 'def', name: 'def' },
            ],
        );
        expect(g.isInAudience({ id: 'abc', name: 'abc' })).toBeTruthy();
        expect(g.isInAudience({ id: 'def', name: 'def' })).toBeTruthy();
        expect(g.isInAudience({ id: 'anyone', name: 'anyone' })).toBeFalsy();
    });

    it('serializes the object correctly', () => {
        const g = new Session(
            SessionStatus.Cancelled,
            shellOwner,
            shellChannel,
            12,
            [{ member: { id: 'memba', name: 'memba' }, hasConnected: true }],
            [],
            [
                { id: 'abc', name: 'abc' },
                { id: 'def', name: 'def' },
            ],
            new Date(1648128592493),
        );
        expect(g.serialize()).toMatchSnapshot();
    });
});
