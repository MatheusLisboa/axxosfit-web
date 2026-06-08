import { StudentAppShell } from './StudentAppShell';

/** Portal do aluno — usado no preview do personal e no app do estudante. */
interface StudentAppPageProps {
  onLogout?: () => void;
}

export function StudentAppPage({ onLogout = () => {} }: StudentAppPageProps) {
  return <StudentAppShell onLogout={onLogout} />;
}
