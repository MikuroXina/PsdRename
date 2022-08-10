import type { LayerPath, LayerStructure } from "../lib/layers";
import type { ChangeEvent } from "react";
import type { Dispatcher } from "../lib/reducer";

interface SubLayerTreeProps {
  layer: Readonly<LayerStructure>;
  dispatch: Dispatcher;
}

const LayerNameInput = ({
  name,
  onChangeName,
}: {
  name: string;
  onChangeName: (event: ChangeEvent<HTMLInputElement>) => void;
}) => <input defaultValue={name} onChange={onChangeName} />;

const LayoutStats = ({
  layer: { id, path, isSelected, sourceInfo, name },
  dispatch,
}: SubLayerTreeProps) => {
  const onToggleSelect = () =>
    dispatch(["TOGGLE_LAYER_SELECTION", { path: [...path] }]);
  const onChangeName = (event: ChangeEvent<HTMLInputElement>) =>
    dispatch([
      "RENAME_LAYER",
      {
        path: [...path],
        newName: event.target.value,
      },
    ]);

  return (
    <div>
      <input type="checkbox" checked={isSelected} onChange={onToggleSelect} />
      {sourceInfo?.canvas && <img src={sourceInfo?.canvas?.toDataURL()} />}
      <LayerNameInput key={id} name={name} onChangeName={onChangeName} />
      <style jsx>{`
        img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
};

const LayerEntry = ({ layer, dispatch }: SubLayerTreeProps) => (
  <>
    <div className="layer-entry">
      <LayoutStats layer={layer} dispatch={dispatch} />
      <div className="controls">
        <TreeItemControls path={layer.path} dispatch={dispatch} />
      </div>
    </div>
    <style jsx>{`
      .layer-entry {
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: space-between;
      }
      .layer-entry > .controls {
        visibility: hidden;
      }
      .layer-entry:hover > .controls {
        visibility: visible;
      }
    `}</style>
  </>
);

interface TreeItemControlsProps {
  path: Readonly<LayerPath>;
  dispatch: Dispatcher;
}

const TreeItemControls = ({ path, dispatch }: TreeItemControlsProps) => {
  const onToggleChildrenSelect = () =>
    dispatch(["TOGGLE_CHILDREN_SELECTION", { path: [...path] }]);
  const onToggleDescendantSelect = () =>
    dispatch(["TOGGLE_DESCENDANT_SELECTION", { path: [...path] }]);
  return (
    <div>
      <button onClick={onToggleChildrenSelect}>
        直接の子レイヤーの選択を反転
      </button>
      <button onClick={onToggleDescendantSelect}>
        子孫レイヤーの選択を反転
      </button>
    </div>
  );
};

const SubLayerTree = ({ layer, dispatch }: SubLayerTreeProps) => (
  <div>
    <ol>
      <li>
        <LayerEntry layer={layer} dispatch={dispatch} />
        {Object.values(layer.children)
          .reverse()
          .map((child) => (
            <SubLayerTree key={child.name} layer={child} dispatch={dispatch} />
          ))}
      </li>
    </ol>
    <style jsx>{`
      ol {
        margin: 0;
      }
      li {
        list-style: none;
        border-width: 1px 0 0;
        border-style: dashed;
      }
    `}</style>
  </div>
);

export interface LayerTreeProps {
  layers: readonly Readonly<LayerStructure>[];
  dispatch: Dispatcher;
}

export const LayerTree = ({ layers, dispatch }: LayerTreeProps) => (
  <div>
    {[...layers].reverse().map((child) => (
      <SubLayerTree key={child.name} layer={child} dispatch={dispatch} />
    ))}
  </div>
);
