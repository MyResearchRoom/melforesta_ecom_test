// middleware/authorize.js
module.exports = function authorize(roles = []) {
    // roles can be a string or an array
    if (typeof roles === "string") {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user found"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You don't have access to this resource"
            });
        }

        next();
    };
};
