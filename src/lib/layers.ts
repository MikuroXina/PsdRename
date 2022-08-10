import type { Layer, Psd } from "ag-psd";
import { set } from "monolite";

declare const layerIdNominal: unique symbol;
export type LayerId = number & { [layerIdNominal]: never };
export type LayerPath = LayerId[];
export type LayerKind = "OPTIONAL" | "REQUIRED" | "RADIO";
export type LayerChildren = Record<string, LayerStructure>;

export interface LayerStructure {
  id: LayerId;
  name: string;
  path: Readonly<LayerPath>;
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

const joinSeparator = (path: LayerPath, sep: string): string[] => {
  const res: string[] = [];
  while (path.length !== 0) {
    res.push(sep);
    res.push(path.shift()!.toString());
  }
  return res;
};
export const joinChildrenSep = (path: LayerPath) =>
  joinSeparator(path, "children");

const kindFromName = (name: string): LayerKind =>
  name.startsWith("!")
    ? "REQUIRED"
    : name.startsWith("*")
    ? "RADIO"
    : "OPTIONAL";

let idStatic = 0;
const newId = (): LayerId => ++idStatic as LayerId;

const parseLayer = (
  id: LayerId,
  layer: Layer,
  parentPath: Readonly<LayerPath>,
): LayerStructure => {
  const path = [...parentPath, id];
  return {
    name: layer.name ?? "",
    id,
    path,
    kind: kindFromName(layer.name ?? ""),
    sourceInfo: layer,
    isSelected: false,
    children: Object.fromEntries(
      layer.children?.map((layer) => {
        const id = newId();
        return [id, parseLayer(id, layer, path)];
      }) ?? [],
    ),
  };
};

export const parseRootLayer = (root: Psd): LayerRoot => ({
  width: root.width,
  height: root.height,
  sourceInfo: root,
  children: Object.fromEntries(
    root.children?.map((layer) => {
      const id = newId();
      return [id, parseLayer(id, layer, [])];
    }) ?? [],
  ),
});

const exportAsLayer = (children: LayerChildren): Layer[] =>
  Object.values(children).map((child) => ({
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
  path: Readonly<LayerPath>;
  originalName: string;
  originalKind: LayerKind;
  newName: string;
  newKind: LayerKind;
}[];

export const traverseByPath = (
  root: Readonly<LayerRoot>,
  path: LayerPath,
  fn: LayerTransformer,
): [LayerRoot, Renaming] => {
  let oldLayer: LayerStructure | null = null,
    newLayer: LayerStructure | null = null;
  const newRoot = set(root, [...joinChildrenSep(path)], (layer) => {
    oldLayer = layer;
    newLayer = fn(layer);
    return newLayer;
  });
  return [
    newRoot,
    [
      {
        originalName: oldLayer!.name,
        originalKind: oldLayer!.kind,
        newName: newLayer!.name,
        newKind: newLayer!.kind,
        path,
      },
    ],
  ];
};

export const traverseSelected = (
  children: Readonly<LayerChildren>,
  fn: LayerTransformer,
): [LayerChildren, Renaming] => {
  const remaining: Renaming = [];
  const newChildren = Object.fromEntries(
    Object.entries(children).map(([key, value]) => {
      const [innerChildren, innerRenaming] = traverseSelected(
        value.children,
        fn,
      );
      remaining.push(...innerRenaming);
      const traversedValue = set(value, (s) => s.children, innerChildren);
      if (!value.isSelected) {
        return [key, traversedValue];
      }
      const newValue = fn(traversedValue);
      remaining.push({
        originalName: value.name,
        originalKind: value.kind,
        newName: newValue.name,
        newKind: newValue.kind,
        path: [...newValue.path],
      });
      return [key, newValue];
    }),
  );
  return [newChildren, remaining];
};
