import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import getUserFromToken from '../utils/auth';

const { ObjectId } = require('mongodb');

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

  static async getShow(req, res) {
    try {
      const token = req.headers('x-token');
      const user = await getUserFromToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      const file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(fileId),
        userId: user._id,
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      const user = await getUserFromToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const limit = 20;
      const skip = page * limit;

      const query = {
        userId: user._id,
        parentId: parentId === '0' ? 0 : ObjectId(parentId),
      };

      const files = await dbClient.db.collection('files')
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.status(200).json(files);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(user._id) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: true } },
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(user._id) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: false } },
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

    return res.status(200).json(updatedFile);
  }
}

export default FilesController;
