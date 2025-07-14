import CreateRoomForm from "@/components/create-room/create-room-form";
import GridPaperBackground from "@/components/ui/grid-background";
import React from "react";

const CreateRoomTemplate = () => {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 flex items-center justify-center">
        <CreateRoomForm />
      </div>
      <GridPaperBackground />
    </div>
  );
};

export default CreateRoomTemplate;
