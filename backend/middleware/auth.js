module.exports = function isAdmin(req, res, next) {
    if (req.user.role !== 'administrator') {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
