import {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "./paymentMethod.service.js";

export async function listPaymentMethodsController(req, res, next) {
  try {
    const includeDisabled = req.query?.all === "1" || req.query?.all === "true";
    const methods = await getPaymentMethods({ includeDisabled });
    res.json({ success: true, data: methods });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentMethodByIdController(req, res, next) {
  try {
    const method = await getPaymentMethodById(req.params.methodId);
    if (!method) {
      res.status(404).json({ success: false, message: "Payment method not found" });
      return;
    }
    res.json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
}

export async function createPaymentMethodController(req, res, next) {
  try {
    const method = await createPaymentMethod(req.body);
    res.status(201).json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentMethodController(req, res, next) {
  try {
    const method = await updatePaymentMethod(req.params.methodId, req.body);
    if (!method) {
      res.status(404).json({ success: false, message: "Payment method not found" });
      return;
    }
    res.json({ success: true, data: method });
  } catch (error) {
    next(error);
  }
}

export async function deletePaymentMethodController(req, res, next) {
  try {
    const deleted = await deletePaymentMethod(req.params.methodId);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Payment method not found" });
      return;
    }
    res.json({ success: true, message: "Payment method deleted" });
  } catch (error) {
    next(error);
  }
}
