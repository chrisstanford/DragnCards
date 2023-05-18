import React, { useState } from "react";
import { Redirect } from "react-router";
import Select from 'react-select'
import axios from "axios";
import ReactModal from "react-modal";
import Button from "../../components/basic/Button";
import useProfile from "../../hooks/useProfile";
import { PleaseLogIn } from "./PleaseLogIn";

const options = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'playtest', label: 'Playtest' },
]

ReactModal.setAppElement("#root");

export const CreateRoomModal = ({ 
  isOpen, 
  isLoggedIn, 
  closeModal, 
  plugin,
}) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomSlugCreated, setRoomSlugCreated] = useState(null);
  const myUser = useProfile();
  const myUserID = myUser?.id;

  const options = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
  ]
  if (myUser?.playtester) options.push({ value: 'playtest', label: 'Playtest' });
  
  const [privacyType, setPrivacyType] = useState(options[0]);

  console.log("Rendering CreateRoomModal")

  const createRoom = async () => {
    const data = { 
      room: { 
        name: "", 
        user: myUserID, 
        privacy_type: privacyType.value,
      },
      game_options: {
        plugin_id: plugin.id,
        plugin_version: plugin.version,
//        replay_id: replayId,
//        ringsdb_info: ringsDbInfo,
//        load_shuffle: loadShuffle,
      }
    };
    console.log("Creating Room",data)
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await axios.post("/be/api/v1/games", data);
      setIsLoading(false);
      if (res.status !== 201) {
        throw new Error("Room not created");
      }
      const room = res.data.success.room;
      setRoomSlugCreated(room.slug);
    } catch (err) {
      setIsLoading(false);
      setIsError(true);
    }
  };

  const handlePrivacyChange = (selectedOption) => {
    setPrivacyType(selectedOption);
  };

  if (roomSlugCreated != null) {
    return <Redirect push to={`/room/${roomSlugCreated}`} />;
  }

  return (
    <ReactModal
      closeTimeoutMS={200}
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Create New Game"
      overlayClassName="fixed inset-0 bg-black-50 z-50"
      className="insert-auto p-5 bg-gray-700 border mx-auto my-12 rounded-lg outline-none"
      style={{
        overlay: {
        },
        content: {
          width: '300px',
        }
      }}>

      <h1 className="mb-2">Create Room</h1>
      {isLoggedIn ?
        <div className="mb-4">
          <Select         
            value={privacyType}
            onChange={handlePrivacyChange}
            options={options} />
          
          <Button onClick={createRoom} className="mt-2" disabled={isLoading}>
            Create
          </Button>
          <Button onClick={closeModal} className="mt-2 bg-red-300">
            Cancel
          </Button>
        </div>
        :
        <PleaseLogIn/>
      }
      {isError && (
        <div className="mt-2 bg-red-200 p-2 rounded border">
          Error creating room. Are you logged in?
        </div>
      )}
    </ReactModal>
  );
};
export default CreateRoomModal;
