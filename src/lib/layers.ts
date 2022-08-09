import type { Layer } from "ag-psd";

export type LayerKind = "OPTIONAL" | "REQUIRED" | "RADIO";

export interface LayerStructure {
  name: string;
  kind: LayerKind;
  isSelected: boolean;
  children: Map<string, LayerStructure>;
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
  isSelected: false,
  children: new Map(
    layer.children?.map((layer) => [layer.name ?? "", parseLayer(layer)]) ?? [],
  ),
});

export const parseRootLayer = (root: Layer): Map<string, LayerStructure> =>
  new Map(
    root.children?.map((layer) => [layer.name ?? "", parseLayer(layer)]) ?? [],
  );

export const traverseByPath = (
  children: Map<string, LayerStructure>,
  path: (string | undefined)[],
): [Map<string, LayerStructure>, string] | undefined => {
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
  console.log(path);
  console.log(children);
  const key = path[0]!;
  const entry = children.get(key);
  if (!entry) {
    return undefined;
  }
  return [children, key];
};

export const traverseSelected = (
  children: Map<string, LayerStructure>,
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
