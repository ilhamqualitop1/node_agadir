const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  createUser,
  updateQueryOTP,
  verifyQueryOTP,
  updateUserPassword,
} = require("../models/userModel");
const { sendOTP } = require("../utils/mailer");
require("dotenv").config();

// Générer un OTP à 6 chiffres
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 🔹 **Inscription de l'utilisateur*
// *
const register = async (req, res) => {
  const { email, password, name, firstname } = req.body;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "L'utilisateur existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 🔹 Par défaut, tout nouvel inscrit est un "user"
    const role = 'user';
    await createUser(email, hashedPassword, name, firstname, role);

    res.status(201).json({ message: "Inscription réussie. Veuillez vous connecter." });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// 🔹 **Connexion avec envoi de l'OTP**
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // Générer OTP et mettre à jour en BDD
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); // Expire dans 10 minutes

    console.log(
      `Génération OTP pour ${email}: ${otp}, expiration: ${otpExpires}`
    );

    const updateSuccess = await updateQueryOTP(email, otp, otpExpires);
    if (!updateSuccess) {
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour de l'OTP." });
    }

    // Envoyer l'OTP par email
    await sendOTP(email, otp);
    res.json({
      message: "Un code de vérification a été envoyé à votre email.",
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Vérification OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValidOtp = await verifyQueryOTP(email, otp); // Vérifie l'OTP en base
    if (!isValidOtp) {
      return res.status(401).json({ message: "Code OTP invalide ou expiré." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

   const accessToken = jwt.sign(
  { id: user.id, email: user.email, role: user.role }, // ✅ inclure le rôle
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);


    res.json({ message: "Vérification réussie.", accessToken, user });
  } catch (err) {
    console.error("Erreur lors de la vérification OTP :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 🔹 **Mot de passe oublié**
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Générer OTP et le stocker
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000);

    const updateSuccess = await updateQueryOTP(email, otp, otpExpires);
    if (!updateSuccess) {
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour de l'OTP." });
    }

    // Envoyer l'OTP
    await sendOTP(email, otp);
    res.json({ message: "OTP envoyé par email." });
  } catch (error) {
    console.error("Erreur dans forgotPassword :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 🔹 **Réinitialisation du mot de passe après validation OTP**
const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res
      .status(400)
      .json({ message: "email, otp et mot de passe sont requis" });
  }

  try {
    const isValidOtp = await verifyQueryOTP(email, otp);
    if (!isValidOtp) {
      return res.status(401).json({ message: "Code OTP invalide ou expiré." });
    }

    // Hacher et mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(email, hashedPassword);

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    console.error("Erreur lors du reset password :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 🔹 **Changement de mot de passe après connexion**
const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Ancien mot de passe incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, hashedPassword);

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur lors du changement de mot de passe :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// **Export des fonctions**
module.exports = {
  register,
  login,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
};
