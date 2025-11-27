const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const geoDataRoutes = require("./routes/geodataRoutes");
const rechercheRoutes = require("./routes/recherche");
const geojsonRoutes = require("./routes/geojson");
const clusterRoutes = require("./routes/clusters");
const parcellesRoutes = require("./routes/parcelles");
const exportRoute = require("./routes/export");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Routes principales
app.use("/api/auth", authRoutes);
app.use("/api/geo-data", geoDataRoutes);
app.use("/api/recherche-fonciere", rechercheRoutes);
app.use("/api/geojson", geojsonRoutes);
app.use("/api/clusters", clusterRoutes);
app.use("/api/parcelles", parcellesRoutes);
app.use("/api/export", exportRoute);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
