import redisClient from '../../utils/redis';
import dbClient from '../../utils/db';

class AppController {
  static getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    return res.status(200).json({
      redis: redisAlive,
      db: dbAlive,
    });
  }

  static getStats(req, res) {
    const usersCount = dbClient.nbUsers();
    const filesCount = dbClient.nbFiles();

    return res.status(200).json({
      users: usersCount,
      files: filesCount,
    });
  }
}
export default AppController;
