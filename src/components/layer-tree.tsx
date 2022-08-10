import type { LayerPath, LayerStructure } from "../lib/layers";
import type { ChangeEvent } from "react";
import type { Dispatcher } from "../lib/reducer";

interface TreeItemControlsProps {
  path: Readonly<LayerPath>;
  dispatch: Dispatcher;
}

const TreeItemControls = ({ path, dispatch }: TreeItemControlsProps) => {
  const onToggleChildrenSelect = () => {
    dispatch({ type: "TOGGLE_CHILDREN_SELECTION", path: [...path] });
  };
  const onToggleDescendantSelect = () => {
    dispatch({ type: "TOGGLE_DESCENDANT_SELECTION", path: [...path] });
  };

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

interface SubLayerTreeProps {
  layer: Readonly<LayerStructure>;
  dispatch: Dispatcher;
}

const SubLayerTree = ({
  layer: { name, path, isSelected, children, sourceInfo },
  dispatch,
}: SubLayerTreeProps) => {
  const onToggleSelect = () => {
    dispatch({ type: "TOGGLE_LAYER_SELECTION", path: [...path] });
  };
  const onChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "RENAME_LAYER",
      path: [...path],
      newName: e.target.value,
    });
  };

  return (
    <div>
      <ol>
        <li>
          <div className="layer-entry">
            <div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
              />
              {sourceInfo?.canvas && (
                <img src={sourceInfo?.canvas?.toDataURL()} />
              )}
              <input defaultValue={name} onChange={onChangeName} />
            </div>
            <div className="controls">
              <TreeItemControls {...{ path, dispatch }} />
            </div>
          </div>
          {Object.values(children)
            .reverse()
            .map((child) => (
              <SubLayerTree
                key={child.name}
                layer={child}
                dispatch={dispatch}
              />
            ))}
        </li>
      </ol>
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
        img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
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
};

export interface LayerTreeProps {
  layers: readonly Readonly<LayerStructure>[];
  dispatch: Dispatcher;
}

export const LayerTree = ({ layers, dispatch }: LayerTreeProps) => {
  return (
    <div>
      {[...layers].reverse().map((child) => (
        <SubLayerTree key={child.name} layer={child} dispatch={dispatch} />
      ))}
    </div>
  );
};
