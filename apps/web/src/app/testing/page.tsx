"use client";

import PaceCalculator from "@components/training/PaceCalculator";
import CreateRun from "@components/runs/CreateRun";
import AuthTest from "@components/AuthTest";
import PlanGenerator from "@components/training/PlanGenerator";
import CreateShoe from "@components/shoes/CreateShoe";

const ProfilePage = () => {
  return (
    <div>
      <h1>Profile Page</h1>
      <PaceCalculator />
      <hr />
      <CreateRun />
      <hr />
      <AuthTest />
      <hr />
      <PlanGenerator />
      <hr />
      <CreateShoe />
    </div>
  );
};

export default ProfilePage;
