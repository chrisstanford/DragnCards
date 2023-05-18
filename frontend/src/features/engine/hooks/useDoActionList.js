import { useContext } from 'react';
import BroadcastContext from '../../../contexts/BroadcastContext';
import store from '../../../store';
import { useGameDefinition } from './useGameDefinition';

export const useDoActionList = () => {
    const gameDef = useGameDefinition();  
    const {gameBroadcast, chatBroadcast} = useContext(BroadcastContext);
    //const playerUi = null; //useSelector(state => state?.playerUi)
    return (idOrList) => {
        // This fuction can take either an id for an action list, in which case it
        // executes the corresponding action list in the game definition, or it can
        // take a list, which it interprests as a custom action list and executes it.
        const isList = Array.isArray(idOrList);
        const state = store.getState();
        var actionList = null;
        if (isList) {
            actionList = idOrList;
        } else if (!isList && Object.keys(gameDef.actionLists).includes(idOrList)) {
            actionList = gameDef.actionLists[idOrList]
        }
        if (actionList != null) {
            var processedActionList = [...actionList];
            for (var i=0; i<processedActionList.length; i++) {
                const action = processedActionList[i];
                if (action[0] === "INPUT") {
                    if (action[1] === "integer") {
                        processedActionList[i] = ["DEFINE", action[2], parseInt(prompt(action[3],action[4]))]
                    } else if (action[1] === "string") {
                        processedActionList[i] = ["DEFINE", action[2], prompt(action[3],action[4])]
                    }
                } else if (action[0] === "CONFIRM") {
                    if (!window.confirm(action[1])) return;
                    else processedActionList.splice(i,1);
                }
            }

            gameBroadcast("game_action", {
                action: "evaluate", 
                options: {
                    action_list: processedActionList, 
                    player_ui: store.getState().playerUi,
                }
            })
        }
    }
}