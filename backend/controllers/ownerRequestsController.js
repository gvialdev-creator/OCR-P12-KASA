const {
  getMyLatestRequest,
  submitOwnerRequest,
  listPendingOwnerRequests,
  decideOwnerRequest,
} = require('../services/ownerRequestsService');

function statusFromError(error) {
  if (error && error.status) return error.status;
  if (error && /UNIQUE/i.test(error.message || '')) return 409;
  return 500;
}

async function submit(req, res) {
  try {
    const request = await submitOwnerRequest(req.app.locals.db, req.user.id);
    res.status(201).json(request);
  } catch (error) {
    res.status(statusFromError(error)).json({ error: error.message });
  }
}

async function getMine(req, res) {
  try {
    const request = await getMyLatestRequest(req.app.locals.db, req.user.id);
    res.json(request);
  } catch (error) {
    res.status(statusFromError(error)).json({ error: error.message });
  }
}

async function listPending(req, res) {
  try {
    res.json(await listPendingOwnerRequests(req.app.locals.db));
  } catch (error) {
    res.status(statusFromError(error)).json({ error: error.message });
  }
}

async function decide(req, res) {
  try {
    const request = await decideOwnerRequest(req.app.locals.db, req.params.id, req.user.id, req.body?.decision);
    res.json(request);
  } catch (error) {
    res.status(statusFromError(error)).json({ error: error.message });
  }
}

module.exports = { submit, getMine, listPending, decide };