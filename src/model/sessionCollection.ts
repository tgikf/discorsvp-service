import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../../discorsvp.key.json';
import Session from '../session/Session';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
});

const converter = {
    toFirestore: (data: Session) => data.serialize(),
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
        const { status, owner, channel, target, squad, others, audience, id } = snap.data();
        return new Session(status, owner, channel, target, squad, others, audience, id);
    },
};

const sessionCollection = getFirestore().collection('sessions').withConverter(converter);

export default sessionCollection;
