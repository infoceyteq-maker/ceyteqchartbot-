import { Workspace } from '@/components/workspace';

// Keep the workspace mounted while navigating between its sections.
export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><Workspace />{children}</>;
}
