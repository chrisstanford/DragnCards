import React, { useState, useEffect, useContext } from "react";
import { useSelector } from 'react-redux';
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BroadcastContext from "../../contexts/BroadcastContext";
import { useGameDefinition } from "./hooks/useGameDefinition";
import store from "../../store";
import { useDoActionList } from "./hooks/useDoActionList";
import Draggable from "react-draggable";

var delayBroadcast;

export const Token = React.memo(({
    cardId,
    cardName,
    tokenType,
    showButtons,
    zIndex,
    aspectRatio,
}) => {
    const doActionList = useDoActionList();
    const rotation = useSelector(state => state?.gameUi?.game?.cardById?.[cardId]?.rotation);
    const tokenValue = useSelector(state => state?.gameUi?.game?.cardById?.[cardId]?.tokens?.[tokenType]) || 0;
    const committed = useSelector(state => state?.gameUi?.game?.cardById?.[cardId]?.committed);
    const [buttonDownVisible, setButtonDownVisible] = useState(false);
    const [buttonUpVisible, setButtonUpVisible] = useState(false);
    const [amount, setAmount] = useState(tokenValue);
    const gameDef = useGameDefinition();
    const token = gameDef?.tokens?.[tokenType];
    if (!token) return;

    useEffect(() => {    
        if (tokenValue !== amount) setAmount(tokenValue);
    }, [tokenValue]);

    if (tokenValue === null) return null;

    function clickArrow(event,delta) {
        event.stopPropagation();
        var newAmount = 0;
        if (!gameDef?.tokens[tokenType]?.modifier && (amount+delta < 0)) {
            newAmount = 0;
        } else {
            newAmount = amount+delta;
        }
        setAmount(newAmount);
        // Determine total number of tokens added or removed since last broadcast
        const totalDelta = newAmount-tokenValue;
        // Set up a delayed broadcast to update the game state that interupts itself if the button is clicked again shortly after.
        if (delayBroadcast) clearTimeout(delayBroadcast);
        delayBroadcast = setTimeout(function() {
            if (totalDelta === 0) return;
            //const state = store.getState();
            const listOfActions = [
                ["GAME_SET_VAL", "/$ACTIVE_CARD_PATH/tokens/" + tokenType, newAmount],
                ["GAME_ADD_MESSAGE", "$PLAYER_N", totalDelta >= 0 ? " added " : " removed ", Math.abs(totalDelta), " ", token.name, " token",
                       Math.abs(totalDelta) > 1 ? "s" : "", totalDelta >= 0 ? " to " : " from ", "$ACTIVE_FACE.name", "."]
            ]
            doActionList(listOfActions);
        }, 500);
    }
    // Prevent doubleclick from interfering with 2 clicks
    function handleDoubleClick(event) {
        event.stopPropagation();
    }
    console.log("tokenscheck", showButtons, amount)
    return(
        <Draggable>
        <div
            style={{
                position: "absolute",
                left: token.left,
                top: token.top,
                height: token.height,
                width: token.width,
                //height: `${22*(1-0.6*(0.7-aspectRatio))}%`,
                zIndex: showButtons ? zIndex + 1 : "",
                display: showButtons || (amount!==0 && amount!==null && amount!==undefined) ? "block" : "none"}}>
            <div
                className="flex absolute text-white text-center w-full h-full items-center justify-left"
                style={{
                    transform: `rotate(${-rotation}deg)`,
                    textShadow: "rgb(0, 0, 0) 2px 0px 0px, rgb(0, 0, 0) 1.75517px 0.958851px 0px, rgb(0, 0, 0) 1.0806px 1.68294px 0px, rgb(0, 0, 0) 0.141474px 1.99499px 0px, rgb(0, 0, 0) -0.832294px 1.81859px 0px, rgb(0, 0, 0) -1.60229px 1.19694px 0px, rgb(0, 0, 0) -1.97999px 0.28224px 0px, rgb(0, 0, 0) -1.87291px -0.701566px 0px, rgb(0, 0, 0) -1.30729px -1.51361px 0px, rgb(0, 0, 0) -0.421592px -1.95506px 0px, rgb(0, 0, 0) 0.567324px -1.91785px 0px, rgb(0, 0, 0) 1.41734px -1.41108px 0px, rgb(0, 0, 0) 1.92034px -0.558831px 0px",
                }}>
                {token.modifier && amount>0 ? "+"+amount : amount}
            </div>

            <div
                className="text-center"
                style={{
                    position: "absolute",
                    height: "50%",
                    width: "100%",
                    top: "50%",
                    backgroundColor: "black",
                    opacity: buttonDownVisible ? "65%" : "0%",
                    display: showButtons ? "block" : "none",
                    zIndex: zIndex + 2,
                }}
                onMouseOver={() => setButtonDownVisible(true)}
                onMouseLeave={() => setButtonDownVisible(false)}
                onClick={(event) => clickArrow(event,-1)}
                onDoubleClick={(event) => handleDoubleClick(event)}>
                <FontAwesomeIcon 
                    className="text-white" 
                    style={{
                        position:"absolute", 
                        top:"15%", 
                        left:"30%",
                    }}  
                    icon={faChevronDown}/>
            </div>

            <div
                className="text-center"
                style={{
                    position: "absolute",
                    height: "50%",
                    width: "100%",
                    backgroundColor: "black",
                    opacity: buttonUpVisible ? "65%" : "0%",
                    display: showButtons ? "block" : "none",
                    zIndex: zIndex + 2,
                }}
                onMouseOver={() => setButtonUpVisible(true)}
                onMouseLeave={() => setButtonUpVisible(false)}
                onClick={(event) => clickArrow(event,1)}
                onDoubleClick={(event) => handleDoubleClick(event)}>
                <FontAwesomeIcon 
                    className="text-white" 
                    style={{
                        position:"absolute", 
                        top:"15%", 
                        left:"30%",
                    }} 
                    icon={faChevronUp}
                />
            </div>
            <img 
                className="block h-full"
                src={token.imageUrl}/> 
        </div>
        </Draggable>
    )
})