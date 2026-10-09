async function listUsers(db) {
  return await db.allAsync('SELECT id, name, picture, role FROM users ORDER BY id DESC');
}

async function getUser(db, id) {
  return await db.getAsync('SELECT id, name, email, picture, role FROM users WHERE id = ?', [id]);
}

async function createUser(db, { name, picture = null, role = 'client' }) {
  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }
  if (!['owner', 'client', 'admin'].includes(role)) {
    const err = new Error('invalid role');
    err.status = 400;
    throw err;
  }
  try {
    const r = await db.runAsync('INSERT INTO users(name, picture, role) VALUES (?,?,?)', [name, picture, role]);
    return await getUser(db, r.lastID);
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) {
      const err = new Error('User already exists');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

async function updateUser(db, id, changes, { allowAdminRole = false } = {}) {
  if (Object.prototype.hasOwnProperty.call(changes || {}, 'role')) {
    const err = new Error('Role changes must use an administrative workflow');
    err.status = 403;
    throw err;
  }
  const allowedFields = ['name', 'email', 'picture'];
  const fields = [];
  const params = [];
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(changes || {}, key)) {
      const value = changes[key];
      if (key === 'name' && (typeof value !== 'string' || !value.trim())) {
        const err = new Error('name is required');
        err.status = 400;
        throw err;
      }
      if (key === 'email' && (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))) {
        const err = new Error('valid email is required');
        err.status = 400;
        throw err;
      }
      if (key === 'picture' && value !== null && typeof value !== 'string') {
        const err = new Error('picture must be a string or null');
        err.status = 400;
        throw err;
      }
      fields.push(`${key} = ?`);
      params.push(key === 'name' || key === 'email' ? value.trim() : value);
    }
  }
  if (fields.length === 0) {
    const err = new Error('No fields to update');
    err.status = 400;
    throw err;
  }
  params.push(id);
  const r = await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  if (r.changes === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return await getUser(db, id);
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
};
