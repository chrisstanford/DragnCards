import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useHistory } from "react-router-dom";
import MUIDataTable, { MUIDataTableOptions } from "mui-datatables";
import Container from "../../components/basic/Container";
import useProfile from "../../hooks/useProfile";
import useDataApi from "../../hooks/useDataApi";
import Button from "../../components/basic/Button";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import axios from "axios";
import { EditPluginModal } from "./EditPluginModal";
import * as moment from 'moment';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { NewPluginModal } from "./NewPluginModal";
import { useSiteL10n } from "../../hooks/useSiteL10n";
import useAuth from "../../hooks/useAuth";

const lobbyButtonClass = "border cursor-pointer hover:bg-white hover:text-black h-full w-full flex items-center justify-center text-white no-underline select-none"
const iconButtonClass = "cursor-pointer hover:bg-white hover:text-black h-full w-full flex items-center justify-center text-white no-underline select-none"

const MyPluginEntry = ({plugin, setSelectedPlugin, forceUpdate, index}) => {
  const siteL10n = useSiteL10n();
  const { authToken, renewToken, setAuthAndRenewToken } = useAuth();
  const authOptions = useMemo(
    () => ({
      headers: {
        Authorization: authToken,
      },
    }),
    [authToken]
  );

  const handleEditClick = () => {
    setSelectedPlugin(plugin);
    // setPluginId(null);
    // setShowModal(true);
  }
  const handleDeleteClick = () => {
    const conf = window.confirm(siteL10n("Are you sure you want to delete your plugin?")+" ("+plugin.name+")");
    if (conf) {
      const res = axios.delete("/be/api/myplugins/"+plugin.id, authOptions);
    }
  }
  return(
    <div className={"relative w-full p-4 text-white "+((index % 2 === 0) ? "bg-gray-700" : "bg-gray-800")}>
      <h1>{plugin.name}</h1>
      <div className="text-xs">Last update: {moment.utc(plugin.updated_at).local().format("YYYY-MM-DD HH:mm:ss")}</div>
      <div className={plugin.public ? "text-xs text-green-500" : "text-xs text-red-500" }>{plugin.public ? "Public" : "Private"}</div>
      <div className="absolute top-0" style={{height: "30px", width: "30px", right: "30px"}}>
        <a className={iconButtonClass} target="_blank" onClick={() => handleEditClick()}>
          <FontAwesomeIcon className="" icon={faEdit}/>
        </a>
      </div>
      <div className="absolute top-0" style={{height: "30px", width: "30px", right: "0px"}}>
        <a className={iconButtonClass} target="_blank" onClick={() => handleDeleteClick()}>
          <FontAwesomeIcon className="" icon={faTrash}/>
        </a>
      </div>
      
    </div>
  )
}

export const MyPlugins = () => {
  const user = useProfile();
  const history = useHistory();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [deletedIndices, setDeletedIndices] = useState([]); 
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  var [wins, losses, incompletes] = [0, 0, 0];
  const { data, isLoading, isError, doFetchUrl, doFetchHash, setData } = useDataApi(
    "/be/api/myplugins/"+user?.id,
    null
  );
  console.log('Rendering MyPlugins', data);
  useEffect(() => {
    if (user?.id) doFetchUrl("/be/api/myplugins/"+user.id);
  }, [user]);
  if (user == null) {
    return null;
  }
  const insertedDate = parseISO(user.inserted_at);
  const insertedAbsolute = format(insertedDate, "yyyy-MM-dd hh:mm bb");
  const insertedRelative = formatDistanceToNow(insertedDate, {
    addSuffix: true,
  });
  const handleNewClick = () => {
    setSelectedPlugin(null);
    setShowNewModal(true);
  }

  return (
    <div className="mt-4 mx-auto w-full p-2" style={{maxWidth: "600px"}}>
      <div className="w-full p-2" style={{height: "70px"}}>
        <a className={lobbyButtonClass} target="_blank" onClick={() => handleNewClick()}>
          New Plugin
        </a>
      </div>
      {data?.my_plugins.map((plugin, index) => {
        return(
          <MyPluginEntry 
            key={index} 
            plugin={plugin} 
            setSelectedPlugin={setSelectedPlugin} 
            forceUpdate={doFetchUrl}
            index={index}
            />)
      })}
      <NewPluginModal
        isOpen={showNewModal}
        closeModal={() => {setShowNewModal(false); setSelectedPlugin(null)}}
      />
      {selectedPlugin !== null &&
      <EditPluginModal
        plugin={selectedPlugin}
        isOpen={selectedPlugin}
        closeModal={() => {setShowNewModal(false); setSelectedPlugin(null)}}
      />}
    </div>
  );
};
export default MyPlugins;
