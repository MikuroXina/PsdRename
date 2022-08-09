import { LayerStructure, traverseByPath, traverseSelected } from "./layers";

export type Action =
  | {
      type: "OPEN_PSD";
      rootLayers: Map<string, LayerStructure>;
    }
  | {
      type: "SELECT_LAYER";
      path: (string | undefined)[];
    }
  | {
      type: "GAIN_REQUIRED_TO_SELECTION";
    };

export type Dispatcher = (action: Action) => void;

export interface State {
  layers: Map<string, LayerStructure>;
  doStack: [];
}

export const initialState = (): State => ({
  layers: new Map(),
  doStack: [],
});

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "OPEN_PSD": {
      return {
        ...state,
        layers: action.rootLayers,
      };
    }
    case "SELECT_LAYER": {
      const res = traverseByPath(state.layers, action.path);
      if (!res) {
        return state;
      }
      const [children, key] = res;
      const entry = children.get(key);
      if (!entry) {
        return state;
      }
      children.set(key, { ...entry, isSelected: true });
      return {
        ...state,
      };
    }
    case "GAIN_REQUIRED_TO_SELECTION": {
      traverseSelected(state.layers, (layer) => ({
        ...layer,
        name: `*${layer.name}`,
        kind: "REQUIRED",
      }));
      return { ...state };
    }
  }
};
