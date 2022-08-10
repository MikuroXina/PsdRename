import {
  LayerChildren,
  LayerPath,
  LayerRoot,
  LayerStructure,
  Renaming,
  applyRedo,
  applyUndo,
  joinChildrenSep,
  overwritePrefixAsRadio,
  overwritePrefixAsRequired,
  removeKindPrefix,
  traverseByPath,
  traverseSelected,
} from "./layers";
import { set } from "monolite";

export interface State {
  root: Readonly<LayerRoot>;
  filename?: string;
  pastHistory: readonly Renaming[];
  futureHistory: readonly Renaming[];
}

const invert = (bool: boolean) => !bool;

const reducers = {
  OPEN_PSD: (state: State, action: { root: LayerRoot; filename: string }) =>
    set(state)
      .set((sel) => sel.root, action.root)
      .set((sel) => sel.filename, action.filename)
      .end(),
  TOGGLE_LAYER_SELECTION: (state: State, action: { path: LayerPath }) =>
    set(state, ["root", ...joinChildrenSep(action.path), "isSelected"], invert),
  TOGGLE_CHILDREN_SELECTION: (state: State, action: { path: LayerPath }) =>
    set(
      state,
      ["root", ...joinChildrenSep(action.path), "children"],
      (children: LayerChildren) =>
        Object.fromEntries(
          Object.entries(children).map(([key, value]) => [
            key,
            set(value, (sel) => sel.isSelected, invert),
          ]),
        ),
    ),
  TOGGLE_DESCENDANT_SELECTION: (state: State, action: { path: LayerPath }) => {
    const invertSelection = (layer: Readonly<LayerStructure>): LayerStructure =>
      set(layer)
        .set((sel) => sel.isSelected, invert)
        .set(
          (sel) => sel.children,
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
  },
  RENAME_LAYER: (
    state: State,
    action: { path: LayerPath; newName: string },
  ) => {
    const [root, renaming] = traverseByPath(
      state.root,
      action.path,
      (layer) => ({
        ...layer,
        name: action.newName,
      }),
    );
    return set(state)
      .set((sel) => sel.root, root)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  GAIN_REQUIRED_TO_SELECTION: (state: State, _action: unknown) => {
    const [children, renaming] = traverseSelected(
      state.root.children,
      (layer) => ({
        ...layer,
        name: overwritePrefixAsRequired(layer.name),
        kind: "REQUIRED",
      }),
    );
    return set(state)
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  GAIN_RADIO_TO_SELECTION: (state: State, _action: unknown) => {
    const [children, renaming] = traverseSelected(
      state.root.children,
      (layer) => ({
        ...layer,
        name: overwritePrefixAsRadio(layer.name),
        kind: "RADIO",
      }),
    );
    return set(state)
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  REMOVE_SPECIFIER_FROM_SELECTION: (state: State, _action: unknown) => {
    const [children, renaming] = traverseSelected(
      state.root.children,
      (layer) => ({
        ...layer,
        name: removeKindPrefix(layer.name),
        kind: "OPTIONAL",
      }),
    );
    return set(state)
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  APPEND_PREFIX_TO_SELECTION: (state: State, action: { prefix: string }) => {
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
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  REMOVE_PREFIX_FROM_SELECTION: (state: State, action: { prefix: string }) => {
    const [children, renaming] = traverseSelected(
      state.root.children,
      (layer) =>
        set(
          layer,
          (sel) => sel.name,
          (name) =>
            name.startsWith(action.prefix)
              ? name.substring(action.prefix.length)
              : name,
        ),
    );
    return set(state)
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  APPEND_POSTFIX_TO_SELECTION: (state: State, action: { postfix: string }) => {
    const [children, renaming] = traverseSelected(
      state.root.children,
      (layer) =>
        set(
          layer,
          (sel) => sel.name,
          (name) =>
            name.endsWith(action.postfix) ? name : `${name}${action.postfix}`,
        ),
    );
    return set(state)
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  REMOVE_POSTFIX_FROM_SELECTION: (
    state: State,
    action: { postfix: string },
  ) => {
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
      .set((sel) => sel.root.children, children)
      .set(
        (sel) => sel.pastHistory,
        (pastHistory) => [...pastHistory, renaming],
      )
      .end();
  },
  DESELECT_ALL: (state: State, _action: unknown) => {
    const [children] = traverseSelected(state.root.children, (layer) => ({
      ...layer,
      isSelected: false,
    }));
    return set(state, (sel) => sel.root.children, children);
  },
  UNDO: (state: State, _action: unknown) => {
    const { pastHistory } = state;
    const toUndo = pastHistory[pastHistory.length - 1];
    return set(state)
      .set(
        (sel) => sel.root,
        (root) => applyUndo(root, toUndo),
      )
      .set(
        (sel) => sel.pastHistory,
        (history) => history.slice(0, history.length - 1),
      )
      .set(
        (sel) => sel.futureHistory,
        (history) => [...history, toUndo],
      )
      .end();
  },
  REDO: (state: State, _action: unknown) => {
    const { futureHistory } = state;
    const toRedo = futureHistory[futureHistory.length - 1];
    return set(state)
      .set(
        (sel) => sel.root,
        (root) => applyRedo(root, toRedo),
      )
      .set(
        (sel) => sel.pastHistory,
        (history) => [...history, toRedo],
      )
      .set(
        (sel) => sel.futureHistory,
        (history) => history.slice(0, history.length - 1),
      )
      .end();
  },
} as const;

type Reducers = typeof reducers;
type Payload<K extends keyof Reducers> = Reducers[K] extends (
  state: State,
  action: infer A,
) => State
  ? A
  : never;

export type Action = {
  [K in keyof Reducers]: [K, Payload<K>];
}[keyof Reducers];

export type Dispatcher = (action: Action) => void;

export const initialState: State = {
  root: {
    width: 0,
    height: 0,
    children: {},
  },
  filename: undefined,
  pastHistory: [],
  futureHistory: [],
};

export const reducer = (
  state: Readonly<State>,
  [kind, payload]: Action,
): State => reducers[kind](state, payload as Payload<typeof kind>);
