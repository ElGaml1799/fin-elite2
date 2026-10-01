import { createFileRoute } from "@tanstack/react-router";
import { Lookup } from "@/components/lookup";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [{ title: "Company lookup" }],
  }),
});

function Home() {
  return <Lookup />;
}
