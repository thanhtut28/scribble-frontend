"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Palette, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateRoomForm from "@/components/create-room/create-room-form";

const CreateRoomTemplate = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 h-16 w-16 rounded-full bg-purple-500 opacity-20"></div>
      <div className="absolute top-40 left-10 h-12 w-12 rounded-full bg-green-500 opacity-20"></div>
      <div className="absolute right-20 bottom-20 h-20 w-20 rounded-full bg-blue-500 opacity-20"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-center text-center">
          <div className="absolute top-4 left-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/join-room")}
              className="flex items-center text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Rooms
            </Button>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-center">
              <Pencil className="mr-2 h-8 w-8 text-amber-600" />
              <h1 className="font-comic text-4xl font-bold text-amber-800">
                Create a Drawing Room
              </h1>
            </div>
            <p className="text-amber-700">
              Set up your drawing room and invite friends for a fun sketching
              session!
            </p>
          </div>
        </div>

        {/* Form container */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <CreateRoomForm
              onSubmitStart={() => setIsCreating(true)}
              onSubmitComplete={() => {
                setIsCreating(false);
                // You can add navigation to the new room here
              }}
            />
          </div>
        </div>

        {/* Tips section */}
        <div className="mt-8 rounded-xl border-4 border-dashed border-amber-300 bg-[#fffdf7] p-4 shadow-md">
          <h3 className="font-comic mb-2 flex items-center text-lg font-semibold text-amber-800">
            <Palette className="mr-2 h-5 w-5 text-amber-600" />
            Drawing Room Tips
          </h3>
          <ul className="ml-6 list-disc space-y-1 text-amber-700">
            <li>More players means more fun! Invite your friends to join.</li>
            <li>Adjust sketch time based on drawing complexity.</li>
            <li>For beginners, try fewer rounds with more time per sketch.</li>
            <li>Use hints wisely - they can help when you&apos;re stuck!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomTemplate;
