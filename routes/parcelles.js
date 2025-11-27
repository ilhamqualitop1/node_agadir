const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT gid
             parcelles,
             ST_AsGeoJSON(geom_wgs)::json AS geometry
      FROM parcelles
      WHERE geom_wgs IS NOT NULL;
    `;
    const { rows } = await pool.query(sql);
    const features = rows
      .filter(r => !containsNaN(r.geometry.coordinates))
      .map(r => ({
        type: "Feature",
        geometry: r.geometry,
        properties: { 
          gid: r.gid, 
          parcelles: r.parcelles   
        }
      }));

    res.json({ type: "FeatureCollection", features });
  } catch (err) {
    console.error("❌ Erreur API /parcelles :", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});


function containsNaN(coords) {
  if (typeof coords === "number") return Number.isNaN(coords);
  if (Array.isArray(coords)) return coords.some(containsNaN);
  return false;
}

module.exports = router;
