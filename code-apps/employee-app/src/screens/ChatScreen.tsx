import { EmptyState } from "../components/EmptyState/EmptyState";

export function ChatScreen() {
  return (
    <EmptyState
      eyebrow="Coming soon"
      title="Ask the Poutine League assistant"
      description="An embedded conversational agent will help you find poutines, log a try, and check standings — built separately via the agent-implementation workflow and wired in once it's ready. This nav entry is reserved so the app's information architecture is complete from day one."
    />
  );
}
