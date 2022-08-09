import { LayerRoot, traverseByPath, traverseSelected } from "./layers";

export type Action =
  | {
      type: "OPEN_PSD";
      root: LayerRoot;
      filename: string;
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
  root: LayerRoot;
  filename?: string;
  doStack: [];
}

export const initialState = (): State => ({
  root: {
    width: 0,
    height: 0,
    children: new Map(),
  },
  filename: undefined,
  doStack: [],
});

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "OPEN_PSD": {
      return {
        ...state,
        root: action.root,
        filename: action.filename,
      };
    }
    case "SELECT_LAYER": {
      const res = traverseByPath(state.root, action.path);
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
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: `!${layer.name}`,
        kind: "REQUIRED",
      }));
      return { ...state };
    }
  }
};
