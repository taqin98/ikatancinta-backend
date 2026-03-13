import { getPackages } from "./package.service.js";

export function listPackages(_req, res) {
  res.json(getPackages());
}
