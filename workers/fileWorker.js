import bull from 'bull';
import path from 'path';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from '../utils/db';

const fileQueue = new Bull('fileQueue');
fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

  if (!file) {
    throw new Error('File not found');
  }

  // Path to the original image file
  const originalFilePath = path.join(__dirname, '../files', file.name);

  // Generate and save thumbnails
  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const thumbnail = await imageThumbnail(originalFilePath, { width: size });
    const thumbnailPath = `${originalFilePath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }

  done();
});

module.exports = { fileQueue };
