"use client";

import React from "react";
import ShoeForm from "@components/shoes/ShoeForm";
import { createShoe } from "@lib/api/shoe";
import { Shoe } from "@maratypes/shoe";
import { useSession } from "next-auth/react";
import { updateUser } from "@lib/api/user/user";
import { Spinner } from "@components/ui";

const CreateShoe: React.FC = () => {
  const { data: session, status } = useSession();

  const handleShoeSubmit = async (shoe: Shoe, makeDefault: boolean) => {
    if (!session?.user?.id) {
      alert("You must be logged in to add a shoe.");
      return;
    }
    try {
      // Attach the logged-in user's ID to the shoe object
      const shoeWithUser: Shoe = {
        ...shoe,
        userId: session.user.id,
      };
      const createdShoe = await createShoe(shoeWithUser);
      console.log("Shoe created successfully:", createdShoe);
      if (makeDefault) {
        await updateUser(session.user.id, {
          defaultShoeId: createdShoe.id,
        });
      }
      // Optionally: Show a success message, redirect, or update UI
    } catch (error) {
      console.error("Error creating shoe:", error);
      // Optionally, show an error notification
    }
  };

  if (status === "loading")
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );

  return (
    <div>
      <h1>Add a New Shoe</h1>
      <ShoeForm onSubmit={handleShoeSubmit} />
    </div>
  );
};

export default CreateShoe;
