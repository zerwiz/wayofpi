import { WorkApp } from "../components/work";

interface WorkPageProps {
  uiMode: string;
  setUiMode: (m: string) => void;
}

export function WorkPage({ uiMode, setUiMode }: WorkPageProps) {
  return <WorkApp uiMode={uiMode} setUiMode={setUiMode} />;
}
