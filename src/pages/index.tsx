import { ChangeEvent, useReducer } from "react";
import type { NextPage } from "next";
import { readPsd } from "ag-psd";
import { LayerTree } from "../components/layer-tree";
import { parseRootLayer } from "../lib/layers";
import { initialState, reducer } from "../lib/reducer";

const Page: NextPage = () => {
  const [state, dispatch] = useReducer(reducer, initialState());
  const onOpenFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    const redPsd = readPsd(await file.arrayBuffer());
    dispatch({ type: "OPEN_PSD", rootLayers: parseRootLayer(redPsd) });
  };
  const onClickAddRequired = () => {
    dispatch({ type: "GAIN_REQUIRED_TO_SELECTION" });
  };

  return (
    <div>
      <h1>PsdRename</h1>
      <label>
        Open PSD File
        <input type="file" onChange={onOpenFile} />
      </label>
      <div className="layer-tree">
        {<LayerTree layers={[...state.layers.values()]} dispatch={dispatch} />}
      </div>
      <div className="controls">
        <button onClick={onClickAddRequired}>選択範囲に必須フラグを付与</button>
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
