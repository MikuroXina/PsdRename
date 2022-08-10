import { ChangeEvent, useReducer } from "react";
import { Psd, readPsd, writePsd } from "ag-psd";
import { exportAsPsd, parseRootLayer } from "../lib/layers";
import { initialState, reducer } from "../lib/reducer";
import { Controls } from "../components/controls";
import { LayerTree } from "../components/layer-tree";
import type { NextPage } from "next";
import { saveAs } from "file-saver";

const saveBufferAsFile = (psd: Psd, filename: string) => {
  const buffer = writePsd(psd);
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, filename);
};

const Page: NextPage = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const onOpenFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    const [file] = event.target.files;
    const redPsd = readPsd(await file.arrayBuffer());
    dispatch([
      "OPEN_PSD",
      {
        filename: file.name,
        root: parseRootLayer(redPsd),
      },
    ]);
  };
  const onClickSave = () => {
    if (!state.filename) {
      return;
    }
    const psd = exportAsPsd(state.root);
    saveBufferAsFile(psd, state.filename);
  };

  return (
    <div>
      <h1>PsdRename</h1>
      <label>
        Open PSD File:
        <input type="file" onChange={onOpenFile} />
      </label>
      <button onClick={onClickSave}>Save as PSD</button>
      <div className="layer-tree">
        <LayerTree
          layers={Object.values(state.root.children)}
          dispatch={dispatch}
        />
      </div>
      <Controls dispatch={dispatch} />
      <style jsx>{`
        .layer-tree {
          height: 50vh;
          overflow: scroll;
          box-shadow: inset 2px 2px 8px black;
        }
      `}</style>
    </div>
  );
};

export default Page;
