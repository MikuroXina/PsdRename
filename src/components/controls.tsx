import { Dispatcher } from "../lib/reducer";

export interface ControlsProps {
  dispatch: Dispatcher;
}

export const Controls = ({ dispatch }: ControlsProps) => {
  const onClickAddRequired = () => {
    dispatch({ type: "GAIN_REQUIRED_TO_SELECTION" });
  };

  return (
    <div>
      <div className="controls">
        <button onClick={onClickAddRequired}>選択範囲に必須フラグを付与</button>
      </div>
    </div>
  );
};
