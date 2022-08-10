import {
  joinChildrenSep,
  LayerChildren,
  LayerPath,
  LayerRoot,
  LayerStructure,
  overwritePrefixAsRadio,
  overwritePrefixAsRequired,
  removeKindPrefix,
  Renaming,
  traverseByPath,
  traverseSelected,
} from "./layers";
import { set } from "monolite";

export type Action =
  | {
      type: "OPEN_PSD";
      root: LayerRoot;
      filename: string;
    }
  | {
      type: "TOGGLE_LAYER_SELECTION";
      path: LayerPath;
    }
  | {
      type: "TOGGLE_CHILDREN_SELECTION";
      path: LayerPath;
    }
  | {
      type: "TOGGLE_DESCENDANT_SELECTION";
      path: LayerPath;
    }
  | {
      type: "RENAME_LAYER";
      path: LayerPath;
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

export type Dispatcher = (action: Action) => void;

export interface State {
  root: Readonly<LayerRoot>;
  filename?: string;
  pastHistory: readonly (Renaming | undefined)[];
  futureHistory: readonly (Renaming | undefined)[];
}

export const initialState = (): State => ({
  root: {
    width: 0,
    height: 0,
    children: {},
  },
  filename: undefined,
  pastHistory: [],
  futureHistory: [],
});

const invert = (b: boolean) => !b;

export const reducer = (state: Readonly<State>, action: Action): State => {
  switch (action.type) {
    case "OPEN_PSD":
      return set(state)
        .set((s) => s.root, action.root)
        .set((s) => s.filename, action.filename)
        .end();

    case "TOGGLE_LAYER_SELECTION":
      return set(
        state,
        ["root", ...joinChildrenSep(action.path), "isSelected"],
        invert,
      );

    case "TOGGLE_CHILDREN_SELECTION":
      return set(
        state,
        ["root", ...joinChildrenSep(action.path), "children"],
        (children: LayerChildren) =>
          Object.fromEntries(
            Object.entries(children).map(([key, value]) => [
              key,
              set(value, (s) => s.isSelected, invert),
            ]),
          ),
      );

    case "TOGGLE_DESCENDANT_SELECTION": {
      const invertSelection = (
        layer: Readonly<LayerStructure>,
      ): LayerStructure =>
        set(layer)
          .set((s) => s.isSelected, invert)
          .set(
            (s) => s.children,
            (children: LayerChildren) =>
              Object.fromEntries(
                Object.entries(children).map(([key, value]) => [
                  key,
                  invertSelection(value),
                ]),
              ),
          )
          .end();
      return set(
        state,
        ["root", ...joinChildrenSep(action.path), "children"],
        (children: LayerChildren) =>
          Object.fromEntries(
            Object.entries(children).map(([key, value]) => [
              key,
              invertSelection(value),
            ]),
          ),
      );
    }
    case "RENAME_LAYER": {
      const [root, renaming] = traverseByPath(
        state.root,
        action.path,
        (layer) => ({
          ...layer,
          name: action.newName,
        }),
      );
      return set(state)
        .set((s) => s.root, root)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "GAIN_REQUIRED_TO_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: overwritePrefixAsRequired(layer.name),
          kind: "REQUIRED",
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "GAIN_RADIO_TO_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: overwritePrefixAsRadio(layer.name),
          kind: "RADIO",
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "REMOVE_SPECIFIER_FROM_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: removeKindPrefix(layer.name),
          kind: "OPTIONAL",
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "APPEND_PREFIX_TO_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: layer.name.startsWith(action.prefix)
            ? layer.name
            : `${action.prefix}${layer.name}`,
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "REMOVE_PREFIX_FROM_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: layer.name.startsWith(action.prefix)
            ? layer.name.substring(action.prefix.length)
            : layer.name,
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "APPEND_POSTFIX_TO_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: layer.name.endsWith(action.postfix)
            ? layer.name
            : `${layer.name}${action.postfix}`,
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "REMOVE_POSTFIX_FROM_SELECTION": {
      const [children, renaming] = traverseSelected(
        state.root.children,
        (layer) => ({
          ...layer,
          name: layer.name.endsWith(action.postfix)
            ? layer.name.slice(0, -action.postfix.length)
            : layer.name,
        }),
      );
      return set(state)
        .set((s) => s.root.children, children)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, renaming],
        )
        .end();
    }
    case "DESELECT_ALL":
      const [children] = traverseSelected(state.root.children, (layer) => ({
        ...layer,
        isSelected: false,
      }));
      return set(state, (s) => s.root.children, children);

    case "UNDO": {
      const pastHistory = state.pastHistory;
      const toUndo = pastHistory[pastHistory.length - 1];
      if (!toUndo) {
        return state;
      }
      let root = state.root;
      for (const op of toUndo) {
        const [newRoot] = traverseByPath(root, [...op.path], (layer) => ({
          ...layer,
          name: op.originalName,
          kind: op.originalKind,
        }));
        root = newRoot;
      }
      return set(state)
        .set((s) => s.root, root)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => pastHistory.slice(0, pastHistory.length - 1),
        )
        .set(
          (s) => s.futureHistory,
          (futureHistory) => [...futureHistory, toUndo],
        )
        .end();
    }
    case "REDO": {
      const futureHistory = state.futureHistory;
      const toRedo = futureHistory[futureHistory.length - 1];
      if (!toRedo) {
        return state;
      }
      let root = state.root;
      for (const op of toRedo) {
        const [newRoot] = traverseByPath(root, [...op.path], (layer) => ({
          ...layer,
          name: op.newName,
          kind: op.newKind,
        }));
        root = newRoot;
      }
      return set(state)
        .set((s) => s.root, root)
        .set(
          (s) => s.pastHistory,
          (pastHistory) => [...pastHistory, toRedo],
        )
        .set(
          (s) => s.futureHistory,
          (futureHistory) => futureHistory.slice(0, futureHistory.length - 1),
        )
        .end();
    }
  }
};
