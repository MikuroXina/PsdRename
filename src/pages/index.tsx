import { ChangeEvent, useState } from "react";
import type { NextPage } from "next";
import { readPsd } from "ag-psd";
import { LayerTree } from "../components/layer-tree";
import { LayerStructure, parseRootLayer } from "../lib/layers";

const Page: NextPage = () => {
  const [rootLayer, setRootLayer] = useState<Map<
    string,
    LayerStructure
  > | null>(null);
  const onOpenFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    console.log(file.name);
    const redPsd = readPsd(await file.arrayBuffer());
    console.log(redPsd);
    setRootLayer(parseRootLayer(redPsd));
  };

  return (
    <div>
      <h1>PsdRename</h1>
      <label>
        Open PSD File
        <input type="file" onChange={onOpenFile} />
      </label>
      <div className="layer-tree">
        {rootLayer !== null && <LayerTree layers={[...rootLayer.values()]} />}
      </div>
      <div className="controls">
        <button>選択範囲に必須フラグを付与</button>
      </div>
      <style jsx>{`
        .layer-tree {
          height: 50vh;
          overflow: scroll;
        }
      `}</style>
    </div>
  );
};

export default Page;
