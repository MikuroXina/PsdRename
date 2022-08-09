import type { LayerStructure } from "../lib/layers";

const SubLayerTree = ({ name, isSelected, children }: LayerStructure) => {
  return (
    <div>
      <ol>
        <li>
          <div className="layer-entry">
            <input type="checkbox" defaultChecked={isSelected} />
            <label>{name}</label>
          </div>
          {[...children.values()].map((child, index) => (
            <SubLayerTree key={index} {...child} />
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
  layers: readonly LayerStructure[];
}

export const LayerTree = ({ layers }: LayerTreeProps) => {
  return (
    <div>
      {layers.map((child, index) => (
        <SubLayerTree key={index} {...child} />
      ))}
    </div>
  );
};
