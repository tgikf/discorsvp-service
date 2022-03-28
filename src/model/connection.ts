import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Session from '../session/Session';

initializeApp({
    credential: applicationDefault(),
});

const converter = {
    toFirestore: (data: Session) => data.serialize(),
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
        const { status, owner, channel, target, squad, others, audience, created } = snap.data();
        return new Session(status, owner, channel, target, squad, others, audience, created.toDate());
    },
};

export const sessionCollection = getFirestore().collection('sessions').withConverter(converter);
export const deviceCollection = getFirestore().collection('devices');
