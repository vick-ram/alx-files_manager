import crypto, { randomUUID } from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const sha1Password = crypto.createHash('sha1').update(password).digest('hex');

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ email, password: sha1Password });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const token = randomUUID();
    const redisKey = `auth_${token}`;
    await redisClient.set(redisKey, user._id.toString(), 24 * 3600);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }
    const redisKey = `auth_${token}`;
    const userId = await redisClient.get(redisKey);

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    await redisClient.del(redisKey);
    return res.status(204).send();
  }
}

export default AuthController;
