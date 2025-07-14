"use client";
import { useEffect } from "react";

export default function BlockConsole() {
  useEffect(() => {
    console.log = () => {};
    console.error = () => {};
  }, []);
  return <></>;
}
