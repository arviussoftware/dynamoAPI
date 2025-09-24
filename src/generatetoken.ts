import jwt from 'jsonwebtoken';

// Define interfaces for your user data structure
interface UserRecord {
    userloginid: string;
    username: string;
    usertypename: string;
    useremail: string;
    checks: any; // Replace 'any' with proper type if known
    usertype: any; // Replace 'any' with proper type if known
    uuid: string;
}

interface UserResultSet {
    recordset: UserRecord[];
    recordsets: any[][]; // Replace 'any' with proper type if known
}

interface DecodedUser {
    userloginid: string,
    userId: string;
    username: string;
    role: string;
    useremail: string;
    skills: any; // Replace 'any' with proper type if known
    checks: any; // Replace 'any' with proper type if known
    usertype: any; // Replace 'any' with proper type if known
    uuid: string;
}

// Secret keys (should be stored in environment variables)
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET: string = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

/**
 * Generates a JWT token for a user
 * @param user The user data to include in the token
 * @returns Generated JWT token
 */
const generateToken = (user: UserResultSet): string => {
    const payload: DecodedUser = {
        userloginid: user.recordset[0].userloginid,
        userId: user.recordset[0].userloginid,
        username: user.recordset[0].username,
        role: user.recordsets[2][0],
        useremail: user.recordset[0].useremail,
        skills: user.recordsets[1][0].skills,
        checks: user.recordsets[0][0].checks,
        usertype: user.recordsets[0][0].usertype,
        uuid: user.recordsets[3][0]?.uuid,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Generates a refresh token for a user
 * @param user The user data to include in the token
 * @returns Generated refresh token
 */
const generateRefreshToken = (user: UserResultSet): string => {
    const payload: DecodedUser = {
        userloginid: user.recordset[0].userloginid,
        userId: user.recordset[0].userloginid,
        username: user.recordset[0].username,
        role: user.recordsets[2][0],
        useremail: user.recordset[0].useremail,
        skills: user.recordsets[1][0].skills,
        checks: user.recordsets[0][0].checks,
        usertype: user.recordsets[0][0].usertype,
        uuid: user.recordsets[3][0].uuid,
    };
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Generates a refresh token from a decoded user object
 * @param user The decoded user data
 * @returns Generated refresh token
 */
const generateRefreshToken1 = (user: DecodedUser): string => {
    const payload: DecodedUser = {
        userloginid: user.userId,
        userId: user.userId,
        username: user.username,
        role: user.role,
        useremail: user.useremail,
        skills: user.skills,
        checks: user.checks,
        usertype: user.usertype,
        uuid: user.uuid
    };
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Checks if a token is expired
 * @param token The JWT token to check
 * @returns True if token is expired, false otherwise
 * @throws Error if token is invalid (other than expiration)
 */
const isTokenExpired = (token: string): boolean => {
    try {
        jwt.verify(token, JWT_SECRET);
        return false; // Token is valid
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            return true; // Token has expired
        }
        throw error; // Other errors (e.g., invalid token)
    }
};

/**
 * Refreshes an access token using a refresh token
 * @param refreshToken The refresh token
 * @returns New access token
 * @throws Error if refresh token is invalid or expired
 */
const refreshAccessToken = (refreshToken: string): string => {
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as DecodedUser;
        const user: DecodedUser = {
            userloginid: decoded.userId,
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            useremail: decoded.useremail,
            skills: decoded.skills,
            checks: decoded.checks,
            usertype: decoded.usertype,
            uuid: decoded.uuid
        };
        return generateaccToken(user);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Generates an access token for a user
 * @param user The user data to include in the token
 * @returns Generated access token
 */
const generateaccToken = (user: DecodedUser): string => {
    const payload: DecodedUser = {
        userloginid: user.userId,
        userId: user.userId,
        username: user.username,
        role: user.role,
        useremail: user.useremail,
        skills: user.skills,
        checks: user.checks,
        usertype: user.usertype,
        uuid: user.uuid
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export {
    generateaccToken,
    generateToken,
    generateRefreshToken,
    isTokenExpired,
    refreshAccessToken,
    generateRefreshToken1,
    UserResultSet,

};

export type { DecodedUser }; // Optional: Export the interface if needed elsewhere