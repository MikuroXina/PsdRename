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
