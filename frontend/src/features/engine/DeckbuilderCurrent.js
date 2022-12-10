import React, { useEffect, useState } from "react";
import { useGameDefinition } from "./functions/useGameDefinition";
import { usePlugin } from "./functions/usePlugin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faDownload, faPlay, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuthOptions } from "../../hooks/useAuthOptions";
import axios from "axios";

const keyClass = "m-auto border cursor-pointer bg-gray-500 hover:bg-gray-400 text-center bottom inline-block";
const keyStyle = {width: "3vh", height: "3vh", borderRadius: "0.5vh"}

export const DeckbuilderCurrent = React.memo(({currentGroupId, setCurrentGroupId, numChanges, setNumChanges, doFetchHash, setHoverCardDetails, modifyDeckList, currentDeck, setCurrentDeck}) => {
  const gameDef = useGameDefinition();
  const authOptions = useAuthOptions();
  const deckbuilder = gameDef.deckbuilder;
  const spawnGroups = deckbuilder.spawnGroups;
  const cardDb = usePlugin()?.card_db || {};
  if (!cardDb) return;

  useEffect(() => {
    if (numChanges > 10) {
      saveCurrentDeck(false);
      setNumChanges(0);
    }
  }, [numChanges]);

  const saveCurrentDeck = async() => {
    const updateData = {deck: currentDeck}
    console.log("myDecks writing")
    const res = await axios.patch(`/be/api/v1/decks/${currentDeck.id}`, updateData, authOptions);
    setNumChanges(0);
    doFetchHash((new Date()).toISOString());
  }

  const deleteCurrentDeck = async() => {
    const result = window.confirm("Delete this deck?")
    if (!result) return;
    const updateData = {deck: currentDeck}
    console.log("myDecks writing")
    const res = await axios.delete(`/be/api/v1/decks/${currentDeck.id}`, updateData, authOptions);
    setNumChanges(0);
    doFetchHash((new Date()).toISOString());
    setCurrentDeck({});
  }

  const exportCurrentDeck = () => {
    const exportList = [];
    for (var i = 0; i < currentDeck.card_uuids.length; i++) {
      exportList.push({
        "uuid": currentDeck.card_uuids[i],
        "name (not required)": cardDb[currentDeck.card_uuids[i]]?.A?.name,
        "quantity": currentDeck.quantities[i],
        "loadGroupId": currentDeck.load_group_ids[i],
      })
    }
    const exportName = currentDeck.name;
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportList, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".txt");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return(
      <div className="bg-gray-800" style={{width:"20%"}}>
        <div className="justify-center p-2 m-2 text-white">
          <div className="justify-center">
            <input 
              autoFocus 
              type="text"
              id="deckNameInput" 
              name="deckNameInput" 
              className="rounded w-full text-black" 
              placeholder={"Deck Name"}
              value={currentDeck.name}
              onChange={(event) => setCurrentDeck({...currentDeck, name: event.target.value})}/>       
          </div>
          <div className="flex justify-center">
            <div className="m-1">
              <div 
                className={keyClass + " m-2"} 
                style={keyStyle}
                onClick={()=>{saveCurrentDeck()}}>
                  <FontAwesomeIcon icon={faSave}/>
              </div>   
              <div 
                className={keyClass + " m-1"} 
                style={keyStyle}
                onClick={()=>{saveCurrentDeck()}}>
                  <FontAwesomeIcon icon={faPlay}/>
              </div>  
              <div 
                className={keyClass + " m-1"} 
                style={keyStyle}
                onClick={()=>{exportCurrentDeck()}}>
                  <FontAwesomeIcon icon={faDownload}/>
              </div>
              <div 
                className={keyClass + " m-1"} 
                style={keyStyle}
                onClick={()=>{deleteCurrentDeck()}}>
                  <FontAwesomeIcon icon={faTrash}/>
              </div>
            </div>
          </div>
        </div>
        
        {spawnGroups?.map((groupInfo, _groupIndex) => {
          const groupId = groupInfo.id;
          return(
            <div>
              <div 
                className={"text-white pl-3 py-1 mt-2 cursor-pointer " + (currentGroupId === groupId ? "bg-red-800" : "bg-gray-900")}
                onClick={() => setCurrentGroupId(groupId)}>
                {groupInfo.label}
              </div>
              {currentDeck?.card_uuids?.map((cardUuid, index) => {
                if (currentDeck.load_group_ids[index] === groupId)
                return(
                  <div className="relative p-1 bg-gray-700 text-white"
                    onMouseMove={() => {setHoverCardDetails(cardDb[cardUuid])}}
                    onMouseLeave={() => setHoverCardDetails(null)}>
                    <div 
                      className={keyClass} 
                      style={keyStyle}
                      onClick={()=>modifyDeckList(cardUuid, -currentDeck.quantities[index], groupId, index)}>
                        <FontAwesomeIcon icon={faTrash}/>
                    </div>
                    <div className="inline-block px-2 max-w-1/2">{cardDb[cardUuid]?.A?.name}</div>
                    <div className="absolute p-1 right-0 top-0">
                      <div 
                        className={keyClass} 
                        style={keyStyle}
                        onClick={()=>modifyDeckList(cardUuid, -1, groupId, index)}>
                          <FontAwesomeIcon icon={faChevronLeft}/>
                      </div>
                      <div className="inline-block px-2">{currentDeck.quantities[index]}</div>
                      <div 
                        className={keyClass} 
                        style={keyStyle}
                        onClick={()=>modifyDeckList(cardUuid, 1, groupId, index)}>
                          <FontAwesomeIcon icon={faChevronRight}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
})