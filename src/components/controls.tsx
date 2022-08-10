import type { Dispatcher } from "../lib/reducer";
import { useRef } from "react";

export interface ControlsProps {
  dispatch: Dispatcher;
}

export const Controls = ({ dispatch }: ControlsProps) => {
  const prefixPattern = useRef<HTMLInputElement>(null);
  const postfixPattern = useRef<HTMLInputElement>(null);

  const onAddRequired = () => {
    dispatch({ type: "GAIN_REQUIRED_TO_SELECTION" });
  };
  const onAddRadio = () => {
    dispatch({ type: "GAIN_RADIO_TO_SELECTION" });
  };
  const onRemoveSpecifier = () => {
    dispatch({ type: "REMOVE_SPECIFIER_FROM_SELECTION" });
  };
  const onAddPrefix = () => {
    dispatch({
      type: "APPEND_PREFIX_TO_SELECTION",
      prefix: prefixPattern.current?.value ?? "",
    });
  };
  const onRemovePrefix = () => {
    dispatch({
      type: "REMOVE_PREFIX_FROM_SELECTION",
      prefix: prefixPattern.current?.value ?? "",
    });
  };
  const onAddPostfix = () => {
    dispatch({
      type: "APPEND_POSTFIX_TO_SELECTION",
      postfix: postfixPattern.current?.value ?? "",
    });
  };
  const onRemovePostfix = () => {
    dispatch({
      type: "REMOVE_POSTFIX_FROM_SELECTION",
      postfix: postfixPattern.current?.value ?? "",
    });
  };
  const onDeselectAll = () => {
    dispatch({ type: "DESELECT_ALL" });
  };
  const onUndo = () => {
    dispatch({ type: "UNDO" });
  };
  const onRedo = () => {
    dispatch({ type: "REDO" });
  };

  return (
    <div>
      <div className="controls">
        <button onClick={onAddRequired}>選択範囲に必須フラグを付与</button>
        <button onClick={onAddRadio}>選択範囲にラジオフラグを付与</button>
        <button onClick={onRemoveSpecifier}>選択範囲のフラグを除去</button>
        <div>
          <label>パターン:</label>
          <input ref={prefixPattern} placeholder="パターン" />
          <button onClick={onAddPrefix}>
            選択範囲に対してパターンを名前の前に追加
          </button>
          <button onClick={onRemovePrefix}>
            選択範囲に対してパターンを名前の前から削除
          </button>
        </div>
        <div>
          <label>パターン:</label>
          <input ref={postfixPattern} placeholder="パターン" />
          <button onClick={onAddPostfix}>
            選択範囲に対してパターンを名前の後ろに追加
          </button>
          <button onClick={onRemovePostfix}>
            選択範囲に対してパターンを名前の後ろから削除
          </button>
        </div>
        <button onClick={onDeselectAll}>全選択解除</button>
        <button onClick={onUndo}>取り消す</button>
        <button onClick={onRedo}>やり直す</button>
      </div>
    </div>
  );
};
