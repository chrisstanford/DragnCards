import React, { useCallback } from "react";
import UserName from "../user/UserName";
import useProfile from "../../hooks/useProfile";
import { Link } from "react-router-dom";
import MUIDataTable, { MUIDataTableOptions } from "mui-datatables";
import useDataApi from "../../hooks/useDataApi";
import useChannel from "../../hooks/useChannel";

const columns = [
  {name: "name", label: "Label", options: { filter: false, sort: true }},
  {name: "host", label: "Host", options: { filter: false, sort: true }},
  //{name: "looking_for_players", label: "Looking for players", options: { filter: true, sort: true }},
  {name: "mode", label: "Mode", options: { filter: true, sort: true }},
  {name: "num_players", label: "Seats", options: { filter: true, sort: true }},
  {name: "status", label: "Status", options: { filter: true, sort: true }},
 ];

export const LobbyTable = ({ selectedPlugin }) => {
  const myUser = useProfile();
  const currentUnixTime = Math.floor(Date.now() / 1000);
  const options = {
    filterType: "checkbox",
    selectableRows: "none",
    download: false,
    print: false,
    sortOrder: {
      name: 'status',
      direction: 'asc',
    },
    rowsPerPage: 20,
    rowsPerPageOptions: [10, 20, 50, 200],
  }
  const { isLoading, isError, data, setData } = useDataApi(
    "/be/api/rooms",
    null
  );

    console.log("Rendering LobbyTable", data)

  const onChannelMessage = useCallback(
    (event, payload) => {
      if (event === "rooms_update" && payload.rooms != null) {
        setData({ data: payload.rooms });
      }
    },
    [setData]
  );
  useChannel("lobby:lobby", onChannelMessage, myUser?.id);
  const rooms = data != null && data.data != null ? data.data : [];

  var filteredRooms = [];
  var activePrivate = 0;
  var activeRooms = 0;
  if (rooms) {
    for (var i=0; i<rooms.length; i++) {
    //for (var replay of replayData) {
      var room = rooms[i];
      console.log("Room 1", {room, selectedPlugin})
      const elapsedSeconds = (room.last_update ? currentUnixTime - room.last_update : Number.MAX_SAFE_INTEGER);
      const status = (elapsedSeconds < 60 ? "Active" : "Idle");
      if (status === "Active") activeRooms++;
      if (status === "Active" && room.privacy_type !== "public") activePrivate++;
      if (room.plugin_id !== selectedPlugin.id) continue;
      console.log("Room 2", {room, selectedPlugin})
      // Currently there is no "admin" user field so I am usering supporter_level === 100 as a hack
      if (room.privacy_type === "public" || myUser?.id === room.created_by || myUser?.admin) {
        console.log("pluginuuid",room.plugin_id, selectedPlugin.plugin_id)
        filteredRooms.push({
          name: <Link to={"/room/" + room.slug}>{room.name || "Unspecified"}</Link>,
          host: <UserName userID={room.created_by} defaultName="Unspecified"></UserName>,
          //looking_for_players: "No",
          num_players: room.num_players || 1,
          mode: room.privacy_type.charAt(0).toUpperCase() + room.privacy_type.slice(1),
          status: status,
        })
      }
    }
  }

  const compare = ( a, b ) => {
    if ( a.name < b.name ){
      return -1;
    }
    if ( a.name > b.name ){
      return 1;
    }
    return 0;
  }
  
  filteredRooms.sort( compare );

  if (filteredRooms.length === 0) {
    return (
      <div className="p-3 text-white rounded bg-gray-700 w-full">
        No rooms created.
      </div>
    );
  }
  return (
    <>

      {isLoading && <div className="text-white text-center">Connecting to server...</div>}
      {isError && <div className="text-white text-center">Error communicating with server...</div>}
      <MUIDataTable
        title={"Rooms ("+activeRooms+" active)"}
        data={filteredRooms}
        columns={columns}
        options={options}
      />
    </>
  );
};
export default LobbyTable;
