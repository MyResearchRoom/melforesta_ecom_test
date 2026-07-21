// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // import your User model

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // find user from DB
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }

        req.user = user; // attach user to request
        next();
    } catch (error) {
        console.error("AuthMiddleware error:", error);
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token"
        });
    }
};
