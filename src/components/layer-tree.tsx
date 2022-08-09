import type { LayerStructure } from "../lib/layers";
import type { Dispatcher } from "../lib/reducer";

interface SubLayerTreeProps {
  layer: LayerStructure;
  path: string[];
  dispatch: Dispatcher;
}

const SubLayerTree = ({
  layer: { name, isSelected, children },
  path,
  dispatch,
}: SubLayerTreeProps) => {
  const onToggleSelect = () => {
    dispatch({ type: "SELECT_LAYER", path });
  };
  return (
    <div>
      <ol>
        <li>
          <div className="layer-entry">
            <input
              type="checkbox"
              defaultChecked={isSelected}
              onChange={onToggleSelect}
            />
            <label>{name}</label>
          </div>
          {[...children.values()].reverse().map((child) => (
            <SubLayerTree
              key={child.name}
              path={[...path, child.name]}
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
        }
        ol {
          margin: 0;
        }
        li {
          list-style: none;
        }
      `}</style>
    </div>
  );
};

export interface LayerTreeProps {
  layers: LayerStructure[];
  dispatch: Dispatcher;
}

export const LayerTree = ({ layers, dispatch }: LayerTreeProps) => {
  return (
    <div>
      {layers.reverse().map((child) => (
        <SubLayerTree
          key={child.name}
          path={[child.name]}
          layer={child}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
};
