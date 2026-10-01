import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueue } from "@/components/review-queue";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
  head: () => ({
    meta: [{ title: "Review queue · Company lookup" }],
  }),
});

function ReviewPage() {
  return <ReviewQueue />;
}
