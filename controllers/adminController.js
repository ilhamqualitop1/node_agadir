const pool = require("../config/db");
const bcrypt = require("bcrypt");

// 🔹 Récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, firstname, name, email, role FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Ajouter un utilisateur
const addUser = async (req, res) => {
  const { firstname, name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (firstname, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, firstname, name, email, role",
      [firstname, name, email, hashedPassword, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, name, email, password, role } = req.body;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET firstname=$1, name=$2, email=$3, password=$4, role=$5 WHERE id=$6",
        [firstname, name, email, hashedPassword, role, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET firstname=$1, name=$2, email=$3, role=$4 WHERE id=$5",
        [firstname, name, email, role, id]
      );
    }

    const updatedUser = await pool.query("SELECT id, firstname, name, email, role FROM users WHERE id=$1", [id]);
    res.json(updatedUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supprimer un utilisateur
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllUsers, addUser, updateUser, deleteUser };
