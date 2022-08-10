import { ChangeEvent, useReducer } from "react";
import { exportAsPsd, parseRootLayer } from "../lib/layers";
import { initialState, reducer } from "../lib/reducer";
import { readPsd, writePsd } from "ag-psd";
import { Controls } from "../components/controls";
import { LayerTree } from "../components/layer-tree";
import type { NextPage } from "next";
import { saveAs } from "file-saver";

const Page: NextPage = () => {
  const [state, dispatch] = useReducer(reducer, initialState());
  const onOpenFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    const redPsd = readPsd(await file.arrayBuffer());
    dispatch({
      type: "OPEN_PSD",
      filename: file.name,
      root: parseRootLayer(redPsd),
    });
  };
  const onClickSave = async () => {
    if (!state.filename) {
      return;
    }
    const psd = exportAsPsd(state.root);
    const buffer = writePsd(psd);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, state.filename);
  };

  return (
    <div>
      <h1>PsdRename</h1>
      <label>
        Open PSD File
        <input type="file" onChange={onOpenFile} />
      </label>
      <button onClick={onClickSave}>Save as PSD</button>
      <div className="layer-tree">
        {
          <LayerTree
            layers={Object.values(state.root.children)}
            dispatch={dispatch}
          />
        }
      </div>
      <Controls dispatch={dispatch} />
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
