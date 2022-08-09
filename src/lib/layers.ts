import type { Layer, Psd } from "ag-psd";

export type LayerKind = "OPTIONAL" | "REQUIRED" | "RADIO";

export type LayerChildren = Map<string, LayerStructure>;

export interface LayerStructure {
  name: string;
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

const kindFromName = (name: string): LayerKind =>
  name.startsWith("!")
    ? "REQUIRED"
    : name.startsWith("*")
    ? "RADIO"
    : "OPTIONAL";

const parseLayer = (layer: Layer): LayerStructure => ({
  name: layer.name ?? "",
  kind: kindFromName(layer.name ?? ""),
  sourceInfo: layer,
  isSelected: false,
  children: new Map(
    layer.children?.map((layer) => [layer.name ?? "", parseLayer(layer)]) ?? [],
  ),
});

export const parseRootLayer = (root: Psd): LayerRoot => ({
  width: root.width,
  height: root.height,
  sourceInfo: root,
  children: new Map(
    root.children?.map((layer) => [layer.name ?? "", parseLayer(layer)]) ?? [],
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

export const traverseByPath = (
  root: LayerRoot,
  path: (string | undefined)[],
): [LayerChildren, string] | undefined => {
  let children = root.children;
  while (true) {
    const [nextLayer] = path;
    if (!nextLayer) {
      return undefined;
    }
    const entry: LayerStructure | undefined = children.get(nextLayer);
    if (!entry) {
      return undefined;
    }
    if (path.length <= 1) {
      break;
    }
    children = entry.children;
    path.shift();
  }
  const key = path[0]!;
  const entry = children.get(key);
  if (!entry) {
    return undefined;
  }
  return [children, key];
};

export const traverseSelected = (
  children: LayerChildren,
  fn: (layer: Readonly<LayerStructure>) => LayerStructure,
): void => {
  for (const [key, value] of children.entries()) {
    traverseSelected(value.children, fn);
    if (value.isSelected) {
      const newValue = fn(value);
      children.set(key, newValue);
    }
  }
};
