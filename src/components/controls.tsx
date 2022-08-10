import { RefObject, useRef } from "react";
import type { Dispatcher } from "../lib/reducer";

export interface ControlsProps {
  dispatch: Dispatcher;
}

export const Controls = ({ dispatch }: ControlsProps) => {
  const prefixPattern = useRef<HTMLInputElement>(null);
  const postfixPattern = useRef<HTMLInputElement>(null);

  const {
    onAddRequired,
    onAddRadio,
    onRemoveSpecifier,
    onAddPrefix,
    onRemovePrefix,
    onAddPostfix,
    onRemovePostfix,
    onDeselectAll,
    onUndo,
    onRedo,
  } = makeCallbacks(dispatch, prefixPattern, postfixPattern);

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

const makeCallbacks = (
  dispatch: Dispatcher,
  prefixPattern: RefObject<HTMLInputElement>,
  postfixPattern: RefObject<HTMLInputElement>,
) => {
  const onAddRequired = () => dispatch(["GAIN_REQUIRED_TO_SELECTION", {}]);
  const onAddRadio = () => dispatch(["GAIN_RADIO_TO_SELECTION", {}]);
  const onRemoveSpecifier = () =>
    dispatch(["REMOVE_SPECIFIER_FROM_SELECTION", {}]);
  const onAddPrefix = () =>
    dispatch([
      "APPEND_PREFIX_TO_SELECTION",
      { prefix: prefixPattern.current?.value ?? "" },
    ]);
  const onRemovePrefix = () =>
    dispatch([
      "REMOVE_PREFIX_FROM_SELECTION",
      { prefix: prefixPattern.current?.value ?? "" },
    ]);
  const onAddPostfix = () =>
    dispatch([
      "APPEND_POSTFIX_TO_SELECTION",
      { postfix: postfixPattern.current?.value ?? "" },
    ]);
  const onRemovePostfix = () =>
    dispatch([
      "REMOVE_POSTFIX_FROM_SELECTION",
      { postfix: postfixPattern.current?.value ?? "" },
    ]);
  const onDeselectAll = () => dispatch(["DESELECT_ALL", {}]);
  const onUndo = () => dispatch(["UNDO", {}]);
  const onRedo = () => dispatch(["REDO", {}]);

  return {
    onAddRequired,
    onAddRadio,
    onRemoveSpecifier,
    onAddPrefix,
    onRemovePrefix,
    onAddPostfix,
    onRemovePostfix,
    onDeselectAll,
    onUndo,
    onRedo,
  };
};
