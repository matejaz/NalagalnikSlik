import app from "./app";
import imagesRoutes from "./images/images.routes";

app.use("/api/images", imagesRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API na http://localhost:${port}`));
