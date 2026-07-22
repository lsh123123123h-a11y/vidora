import u from "@/utils";
import {
  assertImageReferenceSupport,
  RoleMasterImage,
  resolveRoleDerivativeGeneration,
} from "@/lib/characterGenerationPolicy";

export async function assertRoleDerivativeModelSupport(modelId: string): Promise<void> {
  const [vendorId, modelName] = modelId.split(/:(.+)/);
  if (!vendorId || !modelName) throw new Error("An image model must be selected for role derivative generation.");
  const model = (await u.vendor.getModelList(vendorId)).find((candidate: any) => candidate.modelName === modelName);
  assertImageReferenceSupport(model);
}

export async function resolveStoredRoleDerivativeGeneration(parent: RoleMasterImage | undefined, direction: string) {
  return resolveRoleDerivativeGeneration(parent, direction, (filePath) => u.oss.getImageBase64(filePath));
}
