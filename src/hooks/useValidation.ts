import { useMemo } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import {
  buildValidationMap,
  validateDefinition,
} from '@/utils/validation';
import type { ValidationMap, DefValidationErrors } from '@/types/connection';

export interface ValidationResult {
  props: ValidationMap;
  def: DefValidationErrors;
  hasErrors: boolean;
}

/**
 * Returns validation errors for the currently active definition.
 */
export function useValidation(): ValidationResult {
  const { activeDef } = useConnection();

  return useMemo(() => {
    const props = buildValidationMap(activeDef);
    const def = validateDefinition(activeDef);
    // Only blocking errors (no severity or severity='error') gate the output.
    // Warnings (severity='warning') surface in the UI but don't block generation.
    const hasBlockingPropErrors = Object.values(props).some((errs) =>
      errs.some((e) => !e.severity || e.severity === 'error')
    );
    const hasErrors = hasBlockingPropErrors || Object.keys(def).length > 0;
    return { props, def, hasErrors };
  }, [activeDef]);
}
