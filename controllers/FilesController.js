import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { error } from 'console';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/file_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, isPublic = false, parentId = 0, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if ((type === 'file' || type === 'image') && !data) return res.status(400).json({ error: 'Missing data' });

    if (parentId !== 0) {
      const parentFile = await dbClient.collection('files').findOne({ _id: parentId });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const newFile = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      const result = await dbClient.collection('files').insertOne(newFile);
      return res.status(201).json({ id: result.insertedId, ...newFile });
    }

    const fileId = crypto.randomUUID();
    const localPath = path.join(FOLDER_PATH, fileId);

    try {
      if (!fs.existsSync(FOLDER_PATH)) {
        fs.mkdirSync(FOLDER_PATH, { recursive: true });
      }

      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);

      const newFile = {
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      };

      const result = await dbClient.collection('files').insertOne(newFile);
      return res.status(201).json({ id: result.insertedId, ...newFile });
    } catch (error) {
      return res.status(500).json({ error: 'Could not save the file' });
    }
  }

  static async getShow(req, res) { }
  
  static async getIndex(req, res) {}
}

export default FilesController;

const http404 = (req, res) => {
  return res.json({
    error: 'Unauthorized',
  });
}
