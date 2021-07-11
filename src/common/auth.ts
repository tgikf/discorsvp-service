// Authorization middleware. When used, the
// Access Token must exist and be verified against

import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

export const jwtCheck = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://gizzz-service.eu.auth0.com/.well-known/jwks.json',
    }),
    audience: 'gizzz-service',
    issuer: 'https://gizzz-service.eu.auth0.com/',
    algorithms: ['RS256'],
});
