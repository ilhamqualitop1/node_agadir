const express = require("express");
const pool = require("../config/db");
const router = express.Router();
const getLikeValue = (value) => (value ? `%${value}%` : `%`);

router.get("/", async (req, res) => {
  const { nature, num, indice } = req.query;
  console.log("🔎 Paramètres de recherche reçus:", { nature, num, indice });

  try {
    const result = await pool.query(
      `
      SELECT
        nature, num, indice, nvtitre,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM agadirdocc
      WHERE
        nature ILIKE $1 AND
        num::text ILIKE $2 AND
        indice ILIKE $3
      `,
      [
        getLikeValue(nature),
        getLikeValue(num),
        getLikeValue(indice),
      ]
    );

    if (result.rows.length === 0) {
      return res.json({
        type: "FeatureCollection",
        features: [],
      });
    }

   
    const features = result.rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        nature: row.nature,
        num: row.num,
        indice: row.indice,
        nvtitre: row.nvtitre,
      },
    }));

    
    res.json({
      type: "FeatureCollection",
      features,
    });
  } catch (error) {
    console.error("❌ Erreur recherche-foncière :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
