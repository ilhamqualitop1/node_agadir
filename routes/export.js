const express = require("express");
const DXFWriter = require("dxf-writer");
const tokml = require("tokml");

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { format } = req.query;
    const geojson = req.body.geojson || req.body;

    if (!geojson || !geojson.features) {
      return res.status(400).json({ message: "Aucune donnée GeoJSON reçue" });
    }

    // ---------------------------
    // 🔹 EXPORT EN KML
    // ---------------------------
    if (format === "kml") {
      const kml = tokml(geojson);
      res.setHeader("Content-Disposition", "attachment; filename=exported.kml");
      res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
      return res.send(Buffer.from(kml, "utf-8"));
    }

    // ---------------------------
    // 🔹 EXPORT EN DXF
    // ---------------------------
    if (format === "dxf") {
      const dxf = new DXFWriter();
      dxf.addLayer("export", DXFWriter.ACI.GREEN, "CONTINUOUS");
      dxf.setActiveLayer("export");

      geojson.features.forEach((feature) => {
        const geom = feature.geometry;
        if (!geom) return;

        switch (geom.type) {
          case "Point": {
            const [x, y] = geom.coordinates;
            dxf.addPoint(x, y);
            break;
          }

          case "LineString": {
            const points = geom.coordinates;
            for (let i = 0; i < points.length - 1; i++) {
              const [x1, y1] = points[i];
              const [x2, y2] = points[i + 1];
              dxf.addLine(x1, y1, x2, y2);
            }
            break;
          }

          case "Polygon": {
            geom.coordinates.forEach((ring) => {
              const coords = ring.slice();
              // 🔁 Assure que le polygone est bien fermé
              if (
                coords[0][0] !== coords[coords.length - 1][0] ||
                coords[0][1] !== coords[coords.length - 1][1]
              ) {
                coords.push(coords[0]);
              }

              for (let i = 0; i < coords.length - 1; i++) {
                const [x1, y1] = coords[i];
                const [x2, y2] = coords[i + 1];
                dxf.addLine(x1, y1, x2, y2);
              }
            });
            break;
          }

          default:
            console.warn("⚠️ Type de géométrie non pris en charge :", geom.type);
        }
      });

      const buffer = Buffer.from(dxf.stringify(), "utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=exported.dxf");
      res.setHeader("Content-Type", "application/dxf");
      return res.send(buffer);
    }

    return res.status(400).json({ message: "Format non supporté" });
  } catch (err) {
    console.error("Erreur export :", err);
    return res.status(500).json({ message: "Erreur serveur : " + err.message });
  }
});

module.exports = router;
