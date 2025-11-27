
const pool = require("../config/db");

// Vérifier si un utilisateur existe avec cet email
const findUserByEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0];
};

// Exemple de createUser dans userModel.js
const createUser = async (email, password, name, firstname, role = 'user') => {
  const result = await pool.query(
    'INSERT INTO users (email, password, name, firstname, role) VALUES ($1, $2, $3, $4, $5)',
    [email, password, name, firstname, role]
  );
  return result;
};


// Mettre à jour l'OTP et la date d'expiration
const updateQueryOTP = async (email, otp, otpExpire) => {
    try {
        const result = await pool.query(
            "UPDATE users SET otp_code = $1, otp_expires = $2 WHERE email = $3 RETURNING *",
            [otp, otpExpire, email]
        );

        if (result.rowCount === 0) {
            console.error("Aucune mise à jour OTP effectuée pour l'email :", email);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Erreur dans updateOTP :", error);
        return false;
    }
};

// Vérifier un OTP valide
const verifyQueryOTP = async (email, otp) => {
  try {
      const result = await pool.query(
          "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expires > NOW()",
          [email, otp]
      );




      if (result.rows.length > 0) {
         
          await pool.query("UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE email = $1", [email]);
          return true;
      } else {
          return false;
      }
  } catch (error) {
      
      console.error("Erreur dans verifyOTP : ", error.message); 
      throw new Error("Erreur interne lors de la vérification OTP.");  
  }
};


const updateUserPassword = async (email, newPassword) => {
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [newPassword, email]);
};

module.exports = {
    findUserByEmail,
    createUser,
    updateQueryOTP,
    verifyQueryOTP,
    updateUserPassword
};
