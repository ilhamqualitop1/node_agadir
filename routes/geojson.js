const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * === 1. ENREGISTRER PLUSIEURS FEATURES D'UN FICHIER ===
 * Écrase les anciennes features si le fichier existe déjà
 */
router.post("/enregistrer-multiples", async (req, res) => {
  const { fileName, features } = req.body;

  if (!fileName || !features || !features.length) {
    return res.status(400).json({ error: "Nom du fichier et features requis" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔥 Supprimer toutes les anciennes features de ce fichier
    await client.query(`DELETE FROM geojson_imports WHERE file_name = $1`, [fileName]);

    // Ré-insérer les nouvelles features
    for (let feat of features) {
      const geom = JSON.stringify(feat.geometry);
      const props = feat.properties || {};
      const id = feat.id || uuidv4();

      await client.query(
        `INSERT INTO geojson_imports (id, file_name, geom, properties)
         VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4)`,
        [id, fileName, geom, props]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "✅ Fichier enregistré (ancien écrasé si existait déjà)",
      count: features.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erreur insertion features :", err);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

/**
 * === 2. METTRE À JOUR UNE GEOMETRIE ===
 */
router.post("/update-geometry", async (req, res) => {
  const { featureId, geometry, fileName } = req.body;

  if (!featureId || !geometry || !fileName) {
    return res.status(400).json({ error: "featureId, geometry et fileName requis" });
  }

  try {
    const geojsonStr = JSON.stringify(geometry);
    await pool.query(
      `UPDATE geojson_imports 
       SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
       WHERE id = $2 AND file_name = $3`,
      [geojsonStr, featureId, fileName]
    );

    res.status(200).json({ message: "✅ Geometry updated successfully" });
  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * === 3. LISTE DES FICHIERS ENREGISTRÉS ===
 */
router.get("/liste-fichiers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT file_name FROM geojson_imports ORDER BY file_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération fichiers :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * === 4. RÉCUPÉRER UN FICHIER PAR NOM ===
 */
router.get("/liste-fichiers/:filename", async (req, res) => {
  const { filename } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, properties, ST_AsGeoJSON(geom) AS geom
       FROM geojson_imports 
       WHERE file_name = $1`,
      [filename]
    );

    // Toujours renvoyer un FeatureCollection valide
    const features = result.rows.map((row) => ({
      type: "Feature",
      id: row.id,
      properties: row.properties || {},
      geometry: row.geom ? JSON.parse(row.geom) : null,
    }));

    res.json({
      type: "FeatureCollection",
      name: filename,
      features: features || [], // 👈 Jamais undefined
    });
  } catch (err) {
    console.error("Erreur récupération fichier :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
