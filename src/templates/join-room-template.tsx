import RoomList from "@/components/join-room/room-list";
import GridPaperBackground from "@/components/ui/grid-background";
import React from "react";

const JoinRoomTemplate = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0">
        <GridPaperBackground />
      </div>
      <RoomList />
    </div>
  );
};

export default JoinRoomTemplate;
