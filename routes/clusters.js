const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/clusters/polygones', async (req, res) => {
  try {
    
    const bbox = req.query.bbox?.split(',').map(Number);

    if (!bbox || bbox.length !== 4 || bbox.some(isNaN)) {
      return res.status(400).json({ error: 'Paramètre bbox requis (format: minX,minY,maxX,maxY)' });
      
    }

    const [minX, minY, maxX, maxY] = bbox;

    const query = `
  SELECT 
  gid, 
  nvtitre,
  nature,
  num,
  indice,
  type,
  complement,
  nb_bornes,
  surf_adop,
  consistanc,
    ST_AsGeoJSON(ST_Centroid(geom_4326))::json AS geometry
  FROM agadirdocc
  WHERE ST_Intersects(
    geom_4326,
    ST_MakeEnvelope($1, $2, $3, $4, 4326)
  )
  LIMIT 1000
`;
    const { rows } = await pool.query(query, [minX, minY, maxX, maxY]);

    const features = rows.map(row => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
    id: row.gid,
    nvtitre: row.nvtitre,
  nature: row.nature,
  num: row.num,
  indice: row.indice,
  type: row.type,
  complement: row.complement,
  nb_bornes: row.nb_bornes,
  surf_adop: row.surf_adop,
  consistanc: row.consistanc
}

    }));

    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Erreur API /clusters/polygones:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
