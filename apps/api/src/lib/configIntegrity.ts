export function upsertVendorModel<T extends { modelName: string }>(models: T[], modelName: string, model: T): T[] {
  const index = models.findIndex((item) => item.modelName === modelName);
  if (index === -1) return [...models, model];
  return models.map((item, itemIndex) => (itemIndex === index ? model : item));
}

export function clearVendorBinding() {
  return { model: null, modelName: "", vendorId: null };
}
