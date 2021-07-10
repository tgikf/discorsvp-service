import Gizzz from './Gizzz';
import GizzzStatus from './GizzzStatus';

describe('Gizzz', () => {
    it('initializes the first instance with the owner in the squad', () => {
        const g = new Gizzz(GizzzStatus.Pending, 'owner', { server: 'someserver', channel: 'somechannel' }, 4, [], []);
        expect(g.isSquadMember(g.owner));
    });

    it('adds a squad member that is not present in the channel', () => {
        const g = new Gizzz(GizzzStatus.Pending, 'owner', { server: 'someserver', channel: 'somechannel' }, 4, [], []);
        g.addSquadMember('member');
        expect(g.isSquadMember('member')).toBeTruthy;
    });

    it('adds a squad member that is present in the channel correctly and updates the status', () => {
        const g = new Gizzz(
            GizzzStatus.Pending,
            'owner',
            { server: 'someserver', channel: 'somechannel' },
            2,
            [],
            ['member2'],
        );
        g.updateSquadMember('owner', true);
        g.addSquadMember('member2');
        expect(g.status === GizzzStatus.Complete).toBeTruthy();
    });

    it('updates a squad member upon joining the channel correctly and updates the status', () => {
        const g = new Gizzz(GizzzStatus.Pending, 'owner', { server: 'someserver', channel: 'somechannel' }, 2, [], []);
        g.updateSquadMember('owner', true);
        g.addSquadMember('member2');
        expect(g.isComplete()).toBeFalsy();
        g.updateSquadMember('member2', true);
        expect(g.isComplete()).toBeTruthy();
    });

    it('removes a squad member correctly', () => {
        const g = new Gizzz(
            GizzzStatus.Pending,
            'owner',
            { server: 'someserver', channel: 'somechannel' },
            3,
            [
                { memberId: 'owner', hasJoined: false },
                { memberId: 'member3', hasJoined: true },
                { memberId: 'member4', hasJoined: true },
            ],
            [],
        );
        g.removeSquadMember('member3');
        expect(g.gap).toBe(1);
    });

    it('evaluates people included in undefined audience correctly', () => {
        const g = new Gizzz(GizzzStatus.Pending, 'owner', { server: 'someserver', channel: 'somechannel' }, 4, [], []);
        expect(g.isInAudience('abc')).toBeTruthy();
    });

    it('evaluates people included in defined audience correctly', () => {
        const g = new Gizzz(
            GizzzStatus.Pending,
            'owner',
            { server: 'someserver', channel: 'somechannel' },
            4,
            [],
            [],
            'randomId',
            ['abc', 'def'],
        );
        expect(g.isInAudience('abc')).toBeTruthy();
        expect(g.isInAudience('def')).toBeTruthy();
        expect(g.isInAudience('anyone')).toBeFalsy();
    });

    it('serializes the object correctly', () => {
        const g = new Gizzz(
            GizzzStatus.Cancelled,
            'owner',
            { server: 'srv', channel: 'cnl' },
            12,
            [{ memberId: 'memba', hasJoined: true }],
            [],
            'randomId',
            ['abc', 'def'],
        );
        expect(g.serialize()).toEqual({
            _id: 'randomId',
            status: GizzzStatus.Cancelled,
            owner: 'owner',
            channel: { server: 'srv', channel: 'cnl' },
            target: 12,
            audience: ['abc', 'def'],
            squad: [{ memberId: 'memba', hasJoined: true }],
            others: [],
        });
    });
});
