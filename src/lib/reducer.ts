import {
  LayerRoot,
  LayerStructure,
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
      type: "TOGGLE_CHILDREN_SELECTION";
      path: (string | undefined)[];
    }
  | {
      type: "TOGGLE_DESCENDANT_SELECTION";
      path: (string | undefined)[];
    }
  | {
      type: "RENAME_LAYER";
      path: (string | undefined)[];
      newName: string;
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
      const entry = traverseByPath(state.root, action.path);
      if (!entry) {
        return state;
      }
      entry.isSelected = !entry.isSelected;
      return {
        ...state,
      };
    }
    case "TOGGLE_CHILDREN_SELECTION": {
      const entry = traverseByPath(state.root, action.path);
      if (!entry) {
        return state;
      }
      entry.children.forEach((child) => {
        child.isSelected = !child.isSelected;
      });
      return {
        ...state,
      };
    }
    case "TOGGLE_DESCENDANT_SELECTION": {
      const entry = traverseByPath(state.root, action.path);
      if (!entry) {
        return state;
      }
      const invertSelection = (layer: LayerStructure) => {
        layer.isSelected = !layer.isSelected;
        layer.children.forEach(invertSelection);
      };
      entry.children.forEach(invertSelection);
      return {
        ...state,
      };
    }
    case "RENAME_LAYER": {
      const entry = traverseByPath(state.root, action.path);
      if (!entry) {
        return state;
      }
      entry.name = action.newName;
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
