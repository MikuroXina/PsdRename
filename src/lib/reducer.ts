import {
  LayerRoot,
  LayerStructure,
  overwritePrefixAsRadio,
  overwritePrefixAsRequired,
  removeKindPrefix,
  Renaming,
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
    }
  | {
      type: "UNDO";
    }
  | {
      type: "REDO";
    };

const actionTypesCanUndo = [
  "RENAME_LAYER",
  "GAIN_REQUIRED_TO_SELECTION",
  "GAIN_RADIO_TO_SELECTION",
  "REMOVE_SPECIFIER_FROM_SELECTION",
  "APPEND_PREFIX_TO_SELECTION",
  "REMOVE_PREFIX_FROM_SELECTION",
  "APPEND_POSTFIX_TO_SELECTION",
  "REMOVE_POSTFIX_FROM_SELECTION",
] as const;

export type Dispatcher = (action: Action) => void;

export interface State {
  root: LayerRoot;
  filename?: string;
  pastHistory: readonly (Renaming | undefined)[];
  futureHistory: readonly (Renaming | undefined)[];
}

export const initialState = (): State => ({
  root: {
    width: 0,
    height: 0,
    children: new Map(),
  },
  filename: undefined,
  pastHistory: [],
  futureHistory: [],
});

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "OPEN_PSD":
      return {
        ...state,
        root: action.root,
        filename: action.filename,
      };

    case "TOGGLE_LAYER_SELECTION":
      traverseByPath(state.root, action.path, (layer) => ({
        ...layer,
        isSelected: !layer.isSelected,
      }));
      return {
        ...state,
      };

    case "TOGGLE_CHILDREN_SELECTION": {
      traverseByPath(state.root, action.path, (layer) => ({
        ...layer,
        children: new Map(
          [...layer.children.entries()].map(([key, child]) => [
            key,
            {
              ...child,
              isSelected: !child.isSelected,
            },
          ]),
        ),
      }));
      return {
        ...state,
      };
    }
    case "TOGGLE_DESCENDANT_SELECTION": {
      const invertSelection = (
        layer: Readonly<LayerStructure>,
      ): LayerStructure => ({
        ...layer,
        isSelected: !layer.isSelected,
        children: new Map(
          [...layer.children.entries()].map(([key, value]) => [
            key,
            invertSelection(value),
          ]),
        ),
      });
      const entry = traverseByPath(state.root, action.path, invertSelection);
      return {
        ...state,
      };
    }
    case "RENAME_LAYER": {
      const renaming = traverseByPath(state.root, action.path, (layer) => ({
        ...layer,
        name: action.newName,
      }));
      return {
        ...state,
        pastHistory: [...state.pastHistory, renaming],
      };
    }
    case "GAIN_REQUIRED_TO_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: overwritePrefixAsRequired(layer.name),
        kind: "REQUIRED",
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "GAIN_RADIO_TO_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: overwritePrefixAsRadio(layer.name),
        kind: "RADIO",
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "REMOVE_SPECIFIER_FROM_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: removeKindPrefix(layer.name),
        kind: "OPTIONAL",
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "APPEND_PREFIX_TO_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.startsWith(action.prefix)
          ? layer.name
          : `${action.prefix}${layer.name}`,
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "REMOVE_PREFIX_FROM_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.startsWith(action.prefix)
          ? layer.name.substring(action.prefix.length)
          : layer.name,
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "APPEND_POSTFIX_TO_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.endsWith(action.postfix)
          ? layer.name
          : `${layer.name}${action.postfix}`,
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "REMOVE_POSTFIX_FROM_SELECTION": {
      const renaming = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        name: layer.name.endsWith(action.postfix)
          ? layer.name.slice(0, -action.postfix.length)
          : layer.name,
      }));
      return { ...state, pastHistory: [...state.pastHistory, renaming] };
    }
    case "DESELECT_ALL":
      traverseSelected(state.root.children, (layer) => ({
        ...layer,
        isSelected: false,
      }));
      return { ...state };

    case "UNDO": {
      const pastHistory = state.pastHistory;
      const toUndo = pastHistory[pastHistory.length - 1];
      if (!toUndo) {
        return state;
      }
      for (const op of toUndo) {
        traverseByPath(state.root, [...op.path], (layer) => ({
          ...layer,
          name: op.originalName,
          kind: op.originalKind,
        }));
      }
      return {
        ...state,
        pastHistory: pastHistory.slice(0, pastHistory.length - 1),
        futureHistory: [...state.futureHistory, toUndo],
      };
    }
    case "REDO": {
      const futureHistory = state.futureHistory;
      const toRedo = futureHistory[futureHistory.length - 1];
      if (!toRedo) {
        return state;
      }
      for (const op of toRedo) {
        traverseByPath(state.root, [...op.path], (layer) => ({
          ...layer,
          name: op.newName,
          kind: op.newKind,
        }));
      }
      return {
        ...state,
        pastHistory: [...state.pastHistory, toRedo],
        futureHistory: futureHistory.slice(0, futureHistory.length - 1),
      };
    }
  }
};
