const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/polygones", async (req, res) => {
  const query = `
    SELECT 
      nvtitre, nature, num, indice, type, complement, 
      nb_bornes, surf_adop, consistanc, 
      ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry 
      FROM agadirdocc
      LIMIT 100
  `;

  try {
    const { rows } = await pool.query(query);
    const geojson = {
      type: "FeatureCollection",
      features: rows.map((row) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          nvtitre: row.nvtitre,
          nature: row.nature,
          num: row.num,
          indice: row.indice,
          type: row.type,
          complement: row.complement,
          nb_bornes: row.nb_bornes,
          surf_adop: row.surf_adop,
          consistanc: row.consistanc,
        },
      })),
    };

    res.json(geojson);
  } catch (error) {
    console.error("Erreur récupération polygones :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

//  recherche par titre foncier
router.get("/search", async (req, res) => {
  const { numero_titre } = req.query;

  if (!numero_titre) {
    return res.status(400).json({ error: "Paramètre numero_titre manquant" });
  }

  const query = `
    SELECT 
      nvtitre,
      ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
    FROM agadirdocc
    WHERE nvtitre ILIKE $1
  `;

  try {
    const { rows } = await pool.query(query, [`%${numero_titre}%`]);

    const geojson = {
      type: "FeatureCollection",
      features: rows.map((row) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: { nvtitre: row.nvtitre },
      })),
    };

    res.json(geojson);
  } catch (error) {
    console.error("Erreur recherche titre:", error);
    res.status(500).json({ error: "Erreur serveur" });
  
  }
});

module.exports = router;
