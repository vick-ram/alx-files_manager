import dbClient from './db';

async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const user = await dbClient.db.collection('users').findOne({ token });
    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('Error fetching user by token:', err);
    return null;
  }
}

export default getUserFromToken;
