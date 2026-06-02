import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";

export const Route = createFileRoute("/_authenticated/profile_/avatar")({
  component: AvatarCustomizerPage,
});

function AvatarCustomizerPage() {
  const navigate = useNavigate();
  return <AvatarCustomizer onClose={() => navigate({ to: "/profile" })} />;
}
