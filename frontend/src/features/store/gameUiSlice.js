import { createSlice } from "@reduxjs/toolkit";
import { deepUpdate, updateByDelta, updateValues } from "./updateValues";
//const isEqual = require("react-fast-compare");

const initialState = {};

const gameUiSlice = createSlice({
  name: "gameUi",
  initialState,
  reducers: {
    setGameUi: (state, { payload }) => {
      console.log("setting gameui", state, payload)
      if (!state) {
        state = payload;
      } else {
        deepUpdate(state, payload);
      }
      // Object.keys(payload).forEach((key) => {
      //   if (key !== "game") state[key] = payload[key];
      // })
    },
    applyDelta: (state, { payload }) => {
      console.log("setting gameui delta", state, payload)
      if (!state?.game) {
        return;
      } else {
        console.log("setting gameui delta update", JSON.parse(JSON.stringify(state.game)))
        setGame(updateByDelta(state.game, payload));
      }
    },
    setGame: (state, { payload }) => {
      if (!state.game) {
        state.game = payload;
      } else {
        deepUpdate(state.game, payload);
      }
    },
    setGroupById: (state, { payload }) => {
      state.game.groupById = payload;
    },
    setStackIds: (state, { payload }) => {
      state.game.groupById[payload.id].stackIds = payload.stackIds;
    },
    setCardIds: (state, { payload }) => {
      state.game.stackById[payload.id].cardIds = payload.cardIds;
    },
    setValues: (state, { payload }) => {
      console.log("setValues", JSON.parse(JSON.stringify(state)), payload)
      updateValues(state, payload.updates);
    },
  },
});

export const { setGameUi, applyDelta, setGame, setGroupById, setStackIds, setCardIds, setValues } = gameUiSlice.actions;
export default gameUiSlice.reducer;
