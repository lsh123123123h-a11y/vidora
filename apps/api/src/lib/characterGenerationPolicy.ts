export interface RoleMasterImage {
  state?: string | null;
  filePath?: string | null;
  type?: string | null;
  assetsId?: number | null;
  prompt?: string | null;
}

export interface ImageModelReferenceCapability {
  type?: string | null;
  mode?: unknown;
}

export interface RoleDerivativeGeneration {
  prompt: string;
  referenceList: [{ type: "image"; base64: string }];
}

export interface ProductionReferenceAsset {
  name?: string | null;
  type?: string | null;
  assetsId?: number | null;
}

export const masterRoleConstraints = `
这是角色身份母版，不是剧情定妆照或镜头图。
只使用纯白或浅灰无缝背景，均匀棚拍柔光。
只穿无品牌、无图案、无配饰的基础中性日常服装；禁止特殊服装、剧情造型和职业制服。
禁止道具、动作、场景、故事专属情绪、文字、水印和边框。
四视图必须保持面容、五官、体型比例、肤色和发型一致，供后续衍生造型与分镜引用。`;

const plotSpecificDescription = /穿|衣|裤|鞋|饰|餐馆|收银台|手机|道具|场景|室内|室外|系统|催单|抱着手臂|探头|围裙/;

export function buildRootRoleMasterPrompt(name: string, description: string): string {
  const identity = description
    .split(/[，。；、,;\n]/)
    .map((part) => part.trim())
    .filter((part) => part && !plotSpecificDescription.test(part))
    .join("，");

  return `角色名称：${name}。
身份特征：${identity || "请根据角色名称呈现自然、可信的基础身份特征"}。

${masterRoleConstraints.trim()}`;
}

export function appendMasterRoleConstraints(prompt: string): string {
  return `${prompt.trim()}\n\n${masterRoleConstraints.trim()}`;
}

export function assertCompletedRoleMaster<T extends RoleMasterImage>(parent: T | undefined): asserts parent is T & { state: string; filePath: string } {
  if (!parent?.filePath) throw new Error("A completed base role image is required before generating a role derivative.");
  if (parent.state !== "已完成") throw new Error("The base role image must be completed before generating a role derivative.");
  if (parent.type != null && parent.type !== "role") throw new Error("A role derivative must use a role as its direct parent.");
  if (parent.assetsId != null) throw new Error("A role derivative must use a root role as its direct parent.");
}

export function assertImageReferenceSupport(model: ImageModelReferenceCapability | undefined): void {
  const modes = Array.isArray(model?.mode) ? model.mode : [];
  if (model?.type !== "image" || (!modes.includes("singleImage") && !modes.includes("multiReference"))) {
    throw new Error("The selected image model does not support a reference image required for role derivatives.");
  }
}

export function buildRoleDerivativePrompt(parentPrompt: string | null | undefined, direction: string): string {
  return `${parentPrompt || ""}\n\nDerivative role direction:\n${direction}`.trim();
}

export async function resolveRoleDerivativeGeneration(
  parent: RoleMasterImage | undefined,
  direction: string,
  readImage: (filePath: string) => Promise<string>,
): Promise<RoleDerivativeGeneration> {
  assertCompletedRoleMaster(parent);
  const base64 = (await readImage(parent.filePath)).trim();
  if (!base64) throw new Error("The completed base role image could not be loaded for derivative generation.");

  return {
    prompt: buildRoleDerivativePrompt(parent.prompt, direction),
    referenceList: [{ type: "image", base64 }],
  };
}

export function getRootRolesUsedForProduction(assets: ProductionReferenceAsset[]): string[] {
  return assets.filter((asset) => asset.type === "role" && asset.assetsId == null).map((asset) => asset.name || "Unnamed role");
}
