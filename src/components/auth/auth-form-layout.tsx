import React from "react";
import GridPaperBackground from "../ui/grid-background";

interface Props {
  children: React.ReactNode;
}

const AuthFormLayout = ({ children }: Props) => {
  return (
    <main className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0">
        <GridPaperBackground />
      </div>
      {children}
    </main>
  );
};

export default AuthFormLayout;
