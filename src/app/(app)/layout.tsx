import { PageWithNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PageWithNav>{children}</PageWithNav>;
}
