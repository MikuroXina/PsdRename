import type { Layer, Psd } from "ag-psd";

export type LayerKind = "OPTIONAL" | "REQUIRED" | "RADIO";

export type LayerChildren = Map<string, LayerStructure>;

export interface LayerStructure {
  name: string;
  path: readonly string[];
  kind: LayerKind;
  isSelected: boolean;
  sourceInfo?: Layer;
  children: LayerChildren;
}

export interface LayerRoot {
  width: number;
  height: number;
  sourceInfo?: Psd;
  children: LayerChildren;
}

export const removeKindPrefix = (name: string): string => {
  while (name.startsWith("!") || name.startsWith("*")) {
    name = name.substring(1);
  }
  return name;
};

export const appendRequiredPrefix = (name: string) => `!${name}`;
export const appendRadioPrefix = (name: string) => `*${name}`;

export const overwritePrefixAsRequired = (name: string) =>
  appendRequiredPrefix(removeKindPrefix(name));
export const overwritePrefixAsRadio = (name: string) =>
  appendRadioPrefix(removeKindPrefix(name));

const kindFromName = (name: string): LayerKind =>
  name.startsWith("!")
    ? "REQUIRED"
    : name.startsWith("*")
    ? "RADIO"
    : "OPTIONAL";

const parseLayer = (
  layer: Layer,
  parentPath: readonly string[],
): LayerStructure => {
  const path = [...parentPath, layer.name ?? ""];
  return {
    name: layer.name ?? "",
    path,
    kind: kindFromName(layer.name ?? ""),
    sourceInfo: layer,
    isSelected: false,
    children: new Map(
      layer.children?.map((layer) => [
        layer.name ?? "",
        parseLayer(layer, path),
      ]) ?? [],
    ),
  };
};

export const parseRootLayer = (root: Psd): LayerRoot => ({
  width: root.width,
  height: root.height,
  sourceInfo: root,
  children: new Map(
    root.children?.map((layer) => [layer.name ?? "", parseLayer(layer, [])]) ??
      [],
  ),
});

const exportAsLayer = (children: LayerChildren): Layer[] =>
  [...children.values()].map((child) => ({
    ...child.sourceInfo,
    name: child.name,
    children: child.sourceInfo?.canvas
      ? undefined
      : exportAsLayer(child.children),
  }));

export const exportAsPsd = (root: LayerRoot): Psd => ({
  ...root.sourceInfo,
  width: root.width,
  height: root.height,
  children: exportAsLayer(root.children),
});

export type LayerTransformer = (
  layer: Readonly<LayerStructure>,
) => LayerStructure;

export type Renaming = {
  path: readonly (string | undefined)[];
  originalName: string;
  originalKind: LayerKind;
  newName: string;
  newKind: LayerKind;
}[];

export const traverseByPath = (
  root: LayerRoot,
  path: (string | undefined)[],
  fn: LayerTransformer,
): Renaming => {
  let children = root.children;
  while (true) {
    const [nextLayer] = path;
    if (!nextLayer) {
      return [];
    }
    const entry: LayerStructure | undefined = children.get(nextLayer);
    if (!entry) {
      return [];
    }
    if (path.length <= 1) {
      break;
    }
    children = entry.children;
    path.shift();
  }
  const layer = children.get(path[0]!);
  if (!layer) {
    return [];
  }
  const newLayer = fn(layer);
  children.set(path[0]!, newLayer);
  return [
    {
      originalName: layer.name,
      originalKind: layer.kind,
      newName: newLayer.name,
      newKind: newLayer.kind,
      path,
    },
  ];
};

export const traverseSelected = (
  children: LayerChildren,
  fn: LayerTransformer,
): Renaming => {
  const remaining: Renaming = [];
  for (const [key, value] of children.entries()) {
    remaining.push(...traverseSelected(value.children, fn));
    if (value.isSelected) {
      const newValue = fn(value);
      children.set(key, newValue);
      remaining.push({
        originalName: value.name,
        originalKind: value.kind,
        newName: newValue.name,
        newKind: newValue.kind,
        path: [...newValue.path],
      });
    }
  }
  return remaining;
};
