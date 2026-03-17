import { applyAssetResponseHeaders, getDriveAsset, isAssetFresh } from "./asset.service.js";

export async function getDriveAssetController(req, res, next) {
  try {
    const asset = await getDriveAsset(req.params.fileId);

    if (isAssetFresh(req, asset)) {
      applyAssetResponseHeaders(res, asset);
      res.status(304).end();
      return;
    }

    applyAssetResponseHeaders(res, asset);
    res.status(200).send(asset.data);
  } catch (error) {
    next(error);
  }
}
