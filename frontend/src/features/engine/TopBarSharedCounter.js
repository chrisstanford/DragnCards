import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import useFocus from "../../hooks/useFocus";
import { useDoActionList } from "./hooks/useDoActionList";
import { setTyping } from "../store/playerUiSlice";
import { useGameL10n } from "./hooks/useGameL10n";

var delayBroadcast;

export const TopBarSharedCounter = React.memo(({
  gameProperty,
  imageUrl,
  labelId,
}) => {
  const dispatch = useDispatch();
  const doActionList = useDoActionList();
  const l10n = useGameL10n();
  const stateValue = useSelector(state => state?.gameUi?.game?.[gameProperty]);
  const [value, setValue] = useState(stateValue || 0);
  const [previousValue, setPreviousValue] = useState(value);
  const playerN = useSelector(state => state?.playerUi?.playerN);  
  const [inputRef, setInputFocus] = useFocus();

  useEffect(() => {
    setValue(stateValue)
  }, [stateValue])

  const handleValueChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);
    // Set up a delayed broadcast to update the game state that interrupts itself if the button is clicked again shortly after.
    if (delayBroadcast) clearTimeout(delayBroadcast);
    delayBroadcast = setTimeout(function() {
      const totalDelta = newValue - previousValue;
      setPreviousValue(newValue);
      const listOfActions = [
        ["GAME_SET_VAL", "/" + gameProperty, newValue],
        ["GAME_ADD_MESSAGE", "$PLAYER_N", totalDelta >= 0 ? " increased " : " decreased ", l10n(labelId), " by ", Math.abs(totalDelta), "."]
      ];
      doActionList(listOfActions);
      setInputFocus();
    }, 400);
  }

  return(<>
      <div className="h-1/2 w-full flex justify-center">{l10n(labelId)}</div>
      <div className="h-1/2 w-full flex justify-center">
        <img className="h-full ml-1" src={imageUrl}></img>
        <input 
          className="h-full w-1/2 float-left text-center bg-transparent" 
          value={value}
          onChange={handleValueChange}
          type="number" min="0" step="1"
          disabled={playerN ? false : true}
          onFocus={event => dispatch(setTyping(true))}
          onBlur={event => dispatch(setTyping(false))}
          ref={inputRef}>
        </input>
      </div>
    </>
  )
})