import React from "react";
import { useDispatch } from "react-redux";
//import React, { useState, useEffect, useContext } from "react";
//import cx from "classnames";

import useForm from "../../hooks/useForm";
import { setTyping } from "../store/playerUiSlice";


export const ChatInput = ({ chatBroadcast }) => {
  const dispatch = useDispatch();
  const { inputs, handleSubmit, handleInputChange, setInputs } = useForm(
    async () => {
      chatBroadcast("message", { message: inputs.chat });
      setInputs((inputs) => ({
        ...inputs,
        chat: "",
      }));
    }
  );
  return (
    <form className="h-full" onSubmit={handleSubmit}>
      <input
        type="text"
        name="chat"
        placeholder="your message..."
        className="form-control w-full bg-gray-900 text-white border-0 h-full"
        onFocus={event => dispatch(setTyping(true))}
        onBlur={event => dispatch(setTyping(false))}
        onChange={handleInputChange}
        value={inputs.chat || ""}
      />
    </form>
  );
};
export default ChatInput;
