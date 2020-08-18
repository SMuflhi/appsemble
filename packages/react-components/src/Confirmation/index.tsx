import type { BulmaColor } from '@appsemble/sdk';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { PromiseValue } from 'type-fest';

import { CardFooterButton, Modal } from '..';

interface ConfirmationOptions<T, A extends any[]> {
  /**
   * The title to render on the confirmation prompt.
   */
  title: ReactNode;

  /**
   * The body to render on the confirmation prompt.
   */
  body: ReactNode;

  /**
   * The label to render on the cancellation button.
   */
  cancelLabel: ReactNode;

  /**
   * The label to render on the confirmation button.
   */
  confirmLabel: ReactNode;

  /**
   * The color to use for the confirmation button.
   */
  color?: BulmaColor;

  /**
   * The action to perform if the user confirms the action.
   */
  action: (...args: A) => T;
}

interface ConfirmationProps {
  children: ReactNode;
}

interface DeferredConfirmationOptions extends ConfirmationOptions<any, any[]> {
  resolve: () => void;
  reject: () => void;
}

const Context = createContext(null);

/**
 * A provider for the {@link useConfirmation} hook.
 */
export function Confirmation({ children }: ConfirmationProps): ReactElement {
  const [options, setOptions] = useState<DeferredConfirmationOptions>(null);
  const [isActive, setActive] = useState(false);

  const confirm = useCallback(async (opts: ConfirmationOptions<any, any[]>, args) => {
    try {
      await new Promise((resolve, reject) => {
        setOptions({ ...opts, resolve, reject });
        setActive(true);
      });
    } finally {
      // The timeout must match the transition length of Modal.
      setTimeout(() => setActive(false), 90);
    }
    return opts.action(...args);
  }, []);

  return (
    <Context.Provider value={confirm}>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={options?.reject}>{options?.cancelLabel}</CardFooterButton>
            <CardFooterButton color={options?.color ?? 'danger'} onClick={options?.resolve}>
              {options?.confirmLabel}
            </CardFooterButton>
          </>
        }
        isActive={isActive}
        onClose={options?.reject}
        title={options?.title}
      >
        {options?.body}
      </Modal>
      {children}
    </Context.Provider>
  );
}

/**
 * A hook to easily create a configmration dialog.
 *
 * @param options - The configuration options for the modal.
 *
 * @returns A function which triggers the confirmation dialog when called.
 */
export function useConfirmation<T, A extends any[]>(
  options: ConfirmationOptions<T, A>,
): (...args: A) => Promise<PromiseValue<T>> {
  const confirm = useContext(Context);

  return useCallback((...args: A) => confirm(options, args), [confirm, options]);
}
