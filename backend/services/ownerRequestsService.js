function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    status: row.status,
    submitted_at: row.submitted_at,
    decided_at: row.decided_at,
  };
}

async function getRequest(db, requestId) {
  return db.getAsync(
    `SELECT r.id, r.user_id, u.name, u.email, r.status, r.submitted_at, r.decided_at
     FROM owner_requests r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    [requestId]
  );
}

async function getMyLatestRequest(db, userId) {
  const row = await db.getAsync(
    `SELECT id, user_id, status, submitted_at, decided_at
     FROM owner_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
    [userId]
  );
  if (!row) return null;
  return { id: row.id, status: row.status, submitted_at: row.submitted_at, decided_at: row.decided_at };
}

async function submitOwnerRequest(db, userId) {
  const user = await db.getAsync('SELECT role FROM users WHERE id = ?', [userId]);
  if (!user) throw createError('User not found', 404);
  if (user.role !== 'client') throw createError('Only clients can request owner access', 403);

  const pending = await db.getAsync(
    "SELECT id FROM owner_requests WHERE user_id = ? AND status = 'pending'",
    [userId]
  );
  if (pending) throw createError('An owner request is already pending', 409);

  try {
    const result = await db.runAsync("INSERT INTO owner_requests(user_id, status) VALUES (?, 'pending')", [userId]);
    return await getMyLatestRequest(db, userId);
  } catch (error) {
    if (/UNIQUE/i.test(error.message)) throw createError('An owner request is already pending', 409);
    throw error;
  }
}

async function listPendingOwnerRequests(db) {
  const rows = await db.allAsync(
    `SELECT r.id, r.user_id, u.name, u.email, r.status, r.submitted_at, r.decided_at
     FROM owner_requests r JOIN users u ON u.id = r.user_id
     WHERE r.status = 'pending' ORDER BY r.submitted_at ASC, r.id ASC`
  );
  return rows.map(mapRequest);
}

async function decideOwnerRequest(db, requestId, adminId, decision) {
  if (!['approve', 'reject'].includes(decision)) throw createError('decision must be approve or reject', 400);
  const nextStatus = decision === 'approve' ? 'approved' : 'rejected';

  return require('./databaseQueue').transaction(db, async () => {
    const request = await getRequest(db, requestId);
    if (!request) throw createError('Owner request not found', 404);
    if (request.status !== 'pending') throw createError('Owner request has already been decided', 409);

    const update = await db.runAsync(
      "UPDATE owner_requests SET status = ?, decided_at = CURRENT_TIMESTAMP, decided_by = ? WHERE id = ? AND status = 'pending'",
      [nextStatus, adminId, requestId]
    );
    if (update.changes !== 1) throw createError('Owner request has already been decided', 409);

    if (decision === 'approve') {
      const promotion = await db.runAsync("UPDATE users SET role = 'owner' WHERE id = ? AND role = 'client'", [request.user_id]);
      if (promotion.changes !== 1) throw createError('Requester is no longer a client', 409);
    }

    return mapRequest(await getRequest(db, requestId));
  });
}

module.exports = { getMyLatestRequest, submitOwnerRequest, listPendingOwnerRequests, decideOwnerRequest };