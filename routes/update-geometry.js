
app.post("/api/update-geometry", async (req, res) => {
  const { featureId, geometry, filename } = req.body;

  try {
    const geojsonStr = JSON.stringify(geometry);
    await pool.query(
      `UPDATE imported_geometries SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
       WHERE id = $2 AND filename = $3`,
      [geojsonStr, featureId, filename]
    );
    res.status(200).json({ message: "Geometry updated successfully" });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
