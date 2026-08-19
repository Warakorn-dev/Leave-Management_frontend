import { LoaderCircle, type LucideIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/api/utils';

type Action = 'approve' | 'reject' | 'cancel' | 'save' | 'add' | 'delete' | 'edit' | 'view';

const actionVariant: Record<Action, ComponentProps<typeof Button>['variant']> = {
  approve: 'success',
  reject: 'destructive',
  cancel: 'outline',
  save: 'primary',
  add: 'primary',
  delete: 'destructive',
  edit: 'secondary',
  view: 'ghost',
};

type ActionButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & {
  action: Action;
  icon?: LucideIcon;
  loading?: boolean;
  size?: 'sm' | 'default' | 'lg';
};

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'children'> & {
  action: Action;
  icon: LucideIcon;
  label: string;
  size?: 'icon-sm' | 'icon' | 'icon-lg';
};

/**
 * The canonical text action button. Keep action semantics here rather than
 * repeating colors, spacing and loading behavior in page components.
 */
function ActionButton({
  action,
  icon: Icon,
  loading = false,
  size = 'default',
  className,
  children,
  disabled,
  type = 'button',
  onClick,
  ...props
}: ActionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const isLoading = loading || isPending;

  const handleClick: ComponentProps<typeof Button>['onClick'] = async (event) => {
    if (!onClick || isPending) return;

    setIsPending(true);
    try {
      await onClick(event);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      {...props}
      type={type}
      variant={actionVariant[action]}
      size={size}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      className={cn('min-w-fit', className)}
    >
      {isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}

/** Canonical icon-only button. A label is required to prevent unnamed controls. */
function IconButton({
  action,
  icon: Icon,
  label,
  size = 'icon',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <Button {...props} type={type} variant={actionVariant[action]} size={size} aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </Button>
  );
}

export { ActionButton, IconButton, type Action };
