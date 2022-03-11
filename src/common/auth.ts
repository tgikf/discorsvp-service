import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

const client = new JwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://gizzz-service.eu.auth0.com/.well-known/jwks.json',
});

/*
const getSecret = async (token: string) => {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    return kid ? (await client.getSigningKey(kid)).getPublicKey() : undefined;
}; */

const validateTokenSignature = (token: string): Promise<{ sub: string }> =>
    new Promise((resolve, reject) => {
        const getKey = (header: any, callback: any) => {
            client.getSigningKey(header.kid, (err: any, key: any) => callback(null, key.publicKey || key.rsaPublicKey));
        };

        const options = {
            issuer: 'https://gizzz-service.eu.auth0.com/',
            /* algorithms: ['RS256'] */
        };
        jwt.verify(token, getKey, options, (err: any, decoded: any) => {
            if (err) {
                reject(Error(`Token validation error: ${err}`));
            }
            resolve(decoded);
        });
    });

export default validateTokenSignature;
