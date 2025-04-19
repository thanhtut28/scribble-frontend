import React from "react";

interface Props {
  children: React.ReactNode;
}

const AuthFormLayout = ({ children }: Props) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffbf0] p-4">
      {children}
    </main>
  );
};

export default AuthFormLayout;
