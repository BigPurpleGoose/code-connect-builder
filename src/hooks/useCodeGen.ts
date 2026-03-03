import { useMemo } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { generateFile } from '@/utils/codeGen';

/**
 * Returns the generated *.figma.tsx file string, memoized on definitions state.
 */
export function useCodeGen(): string {
  const { definitions } = useConnection();
  return useMemo(() => generateFile(definitions), [definitions]);
}
