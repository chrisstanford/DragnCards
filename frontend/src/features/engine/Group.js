import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Stacks } from "./Stacks";
import { faBars, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBrowseTopN } from "./hooks/useBrowseTopN"; 
import { setDropdownMenu } from "../store/playerUiSlice";
import { useGameL10n } from "./hooks/useGameL10n";
import { useGameDefinition } from "./hooks/useGameDefinition";

export const Group = React.memo(({
  groupId,
  region
}) => {
  console.log("Rendering Group ",groupId);
  const dispatch = useDispatch();
  const l10n = useGameL10n();
  const gameDef = useGameDefinition();
  const group = useSelector(state => state?.gameUi?.game?.groupById?.[groupId]);
  const playerN = useSelector(state => state?.playerUi?.playerN);
  const browseTopN = useBrowseTopN();

  const handleEyeClick = (event) => {
    event.stopPropagation();
    browseTopN(groupId, "All");
  }

  const handleBarsClick = (event) => {
    event.stopPropagation();
    if (!playerN) return;
    const dropdownMenu = {
        type: "group",
        group: group,
        title: group.name,
    }
    console.log("dispatch setDropdownMenu", dropdownMenu)
    if (playerN) dispatch(setDropdownMenu(dropdownMenu));
  }

  if (!group) return null;
  const numStacks = group.stackIds.length;
  const tablename = l10n(gameDef.groups[group.id].tableLabelId);
  return(
    <div className="h-full w-full">
      
        <div
          className="relative h-full float-left select-none text-gray-500"
          style={{width:"17px"}}>
            <div className="relative w-full h-full">
            {region.hideTitle ? null :
              <span 
                className="absolute mt-1 overflow-hidden" 
                style={{fontSize: "1.5vh", top: "50%", left: "50%", transform: `translate(-50%, -70%) rotate(90deg)`, whiteSpace: "nowrap"}}>
                {playerN && <FontAwesomeIcon onClick={(event) => handleEyeClick(event)}  className="hover:text-white mr-2" style={{transform: `rotate(-90deg)`}} icon={faEye}/>}
                {playerN && <FontAwesomeIcon onClick={(event) => handleBarsClick(event)}  className="hover:text-white mr-2" style={{transform: `rotate(-90deg)`}} icon={faBars}/>}
                  {l10n(tablename) + (region.type === "pile" ? " ("+numStacks+")" : "")}
              </span>
            }
            </div>
        </div>
      
      <Stacks
        groupId={group.id}
        region={region}
        selectedStackIndices={[...Array(numStacks).keys()]}
      />
    </div>
  )
})