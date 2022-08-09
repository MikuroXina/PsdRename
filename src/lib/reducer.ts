import {
  LayerRoot,
  overwritePrefixAsRadio,
  overwritePrefixAsRequired,
  removeKindPrefix,
  traverseByPath,
  traverseSelected,
} from "./layers";

export type Action =
  | {
      type: "OPEN_PSD";
      root: LayerRoot;
      filename: string;
    }
  | {
      type: "TOGGLE_LAYER_SELECTION";
      path: (string | undefined)[];
    }
  | {
      type: "GAIN_REQUIRED_TO_SELECTION";
    }
  | {
      type: "GAIN_RADIO_TO_SELECTION";
    }
  | {
      type: "REMOVE_SPECIFIER_FROM_SELECTION";
    }
  | {
      type: "APPEND_PREFIX_TO_SELECTION";
      prefix: string;
    }
  | {
      type: "REMOVE_PREFIX_FROM_SELECTION";
      prefix: string;
    }
  | {
      type: "APPEND_POSTFIX_TO_SELECTION";
      postfix: string;
    }
  | {
      type: "REMOVE_POSTFIX_FROM_SELECTION";
      postfix: string;
    }
  | {
      type: "DESELECT_ALL";
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
    case "OPEN_PSD":
      return {
        ...state,
        root: action.root,
        filename: action.filename,
      };

    case "TOGGLE_LAYER_SELECTION": {
      const res = traverseByPath(state.root, action.path);
      if (!res) {
        return state;
      }
      const [children, key] = res;
      const entry = children.get(key);
      if (!entry) {
        return state;
      }
      children.set(key, { ...entry, isSelected: !entry.isSelected });
      return {
        ...state,
      };
    }
    case "GAIN_REQUIRED_TO_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: overwritePrefixAsRequired(layer.name),
        kind: "REQUIRED",
      }));
      return { ...state };

    case "GAIN_RADIO_TO_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: overwritePrefixAsRadio(layer.name),
        kind: "RADIO",
      }));
      return { ...state };

    case "REMOVE_SPECIFIER_FROM_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: removeKindPrefix(layer.name),
        kind: "OPTIONAL",
      }));
      return { ...state };

    case "APPEND_PREFIX_TO_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.startsWith(action.prefix)
          ? layer.name
          : `${action.prefix}${layer.name}`,
      }));
      return { ...state };

    case "REMOVE_PREFIX_FROM_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.startsWith(action.prefix)
          ? layer.name.substring(action.prefix.length)
          : layer.name,
      }));
      return { ...state };

    case "APPEND_POSTFIX_TO_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.endsWith(action.postfix)
          ? layer.name
          : `${layer.name}${action.postfix}`,
      }));
      return { ...state };

    case "REMOVE_POSTFIX_FROM_SELECTION":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.endsWith(action.postfix)
          ? layer.name.slice(0, -action.postfix.length)
          : layer.name,
      }));
      return { ...state };

    case "DESELECT_ALL":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        isSelected: false,
      }));
      return { ...state };
  }
};
