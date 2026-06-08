import { Toaster } from 'sonner';
import { StudentAppShell } from './components/student-app/StudentAppShell';

export interface StudentFigmaAppProps {
  userName: string;
  userAvatar?: string;
  onLogout: () => void;
}

export function StudentFigmaApp({ onLogout }: StudentFigmaAppProps) {
  return (
    <>
      <Toaster theme="dark" position="top-center" richColors />
      <StudentAppShell onLogout={onLogout} />
    </>
  );
}
