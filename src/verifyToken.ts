import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
interface DecodedToken {
// Add any specific properties you expect in the decoded token
[key: string]: any;
}
interface AuthenticatedRequest extends Request {
user?: DecodedToken;
}
const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
const token = req.headers['authorization'];
if (!token) {
return res.status(403).json({ message: 'No token provided' });
}
// Extract token from "Bearer <token>"
const tokenParts = token.split(' ');
if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
return res.status(401).json({ message: 'Invalid token format' });
}
const authToken = tokenParts[1];
// Verify token
jwt.verify(authToken, JWT_SECRET, (err, decoded) => {
if (err) {
return res.status(401).json({ message: 'Unauthorized access' });
}
// Attach user info to request
req.user = decoded as DecodedToken;
next();
});
};
export default verifyToken;