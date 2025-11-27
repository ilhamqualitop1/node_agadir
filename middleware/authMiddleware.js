const jwt = require("jsonwebtoken");
require("dotenv").config();

// Vérifie le token JWT
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });

  try {
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token invalide." });
  }
};

// Vérifie si l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Accès refusé : réservé aux administrateurs." });
  }
};

module.exports = { verifyToken, isAdmin };
