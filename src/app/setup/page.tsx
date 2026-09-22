import type { Metadata } from "next";
import SetupContent from "./setup-content";

export const metadata: Metadata = {
  title: "One-time Setup — RYmos",
  robots: { index: false, follow: false },
};

export default function SetupPage() {
  return <SetupContent />;
}
