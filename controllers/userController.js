const bcrypt = require("bcryptjs");
const { Pool } = require('pg');


const pool = new Pool({
  user: 'postgres',    
  host: 'localhost',        
  database: 'agadir',      
  password: 'ilham2020', 
  port: 5000,                 
});

// Fonction pour enregistrer un utilisateur dans la base de données
const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);  // 10 correspond au "salt rounds"

    // 2. Insérer l'utilisateur avec l'email et le mot de passe haché dans la base de données
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );

    // Retourner une réponse réussie
    res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de l\'inscription de l\'utilisateur:', err);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

module.exports = { registerUser };
