import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async PostNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
      });
    }

    if (!password) {
      return res.status(400).json({
        error: 'Missing password',
      });
    }

    const userCollection = dbClient.db.collection('users');

    const userExists = await userCollection.findOne({ email });
    const sha1Password = crypto.createHash('sha1').update(password).digest('hex');

    if (userExists) {
      return res.status(400).json({
        error: 'Already exists',
      });
    }

    const result = await userCollection.insertOne({
      email,
      password: sha1Password,
    });

    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const redisKey = `auth_${token}`;
    const userId = await redisClient.get(redisKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: dbClient.getObjectID(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}
export default UsersController;
