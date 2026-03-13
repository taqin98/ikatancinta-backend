import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { buildOpenApiSpec } from "./docs/openapi.js";
import { renderApiPlaygroundHtml } from "./docs/apiPlaygroundHtml.js";
import { renderSwaggerUiHtml } from "./docs/swaggerUiHtml.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import packageRoutes from "./modules/packages/package.routes.js";
import themeRoutes from "./modules/themes/theme.routes.js";
import invitationRoutes from "./modules/invitations/invitation.routes.js";
import uploadRoutes from "./modules/uploads/upload.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/openapi.json", (_req, res) => {
  res.json(buildOpenApiSpec());
});

app.get("/api/docs", (req, res) => {
  const apiBaseUrl = `${req.protocol}://${req.get("host")}/api`;
  res.type("html").send(renderApiPlaygroundHtml(apiBaseUrl));
});

app.get("/api/swagger", (req, res) => {
  const specUrl = `${req.protocol}://${req.get("host")}/api/openapi.json`;
  res.type("html").send(renderSwaggerUiHtml(specUrl));
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "ikatancinta-express-backend-starter",
    providers: {
      dataStore: env.dataStoreProvider,
      mediaStorage: env.mediaStorageProvider,
    },
    date: new Date().toISOString(),
  });
});

app.use("/api/packages", packageRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
