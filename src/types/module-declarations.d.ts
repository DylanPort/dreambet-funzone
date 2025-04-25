
// Declarations for modules without TypeScript definitions

declare module 'sonner' {
  import { ReactNode } from 'react';

  export interface ToastProps {
    id?: string | number;
    title?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    duration?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    className?: string;
    closeButton?: boolean;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    hotkey?: string[];
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
    visibleToasts?: number;
    closeButton?: boolean;
    offset?: string | number;
    theme?: 'light' | 'dark' | 'system';
    className?: string;
  }

  export function toast(
    message: ReactNode | ToastProps,
    options?: Omit<ToastProps, 'title'>
  ): {
    id: number;
    dismiss: () => void;
    update: (props: ToastProps) => void;
  };
  
  toast.success = function(
    message: ReactNode | ToastProps,
    options?: Omit<ToastProps, 'title'>
  ): { id: number; dismiss: () => void; update: (props: ToastProps) => void; };
  
  toast.error = function(
    message: ReactNode | ToastProps,
    options?: Omit<ToastProps, 'title'>
  ): { id: number; dismiss: () => void; update: (props: ToastProps) => void; };
  
  toast.info = function(
    message: ReactNode | ToastProps,
    options?: Omit<ToastProps, 'title'>
  ): { id: number; dismiss: () => void; update: (props: ToastProps) => void; };
  
  toast.warning = function(
    message: ReactNode | ToastProps,
    options?: Omit<ToastProps, 'title'>
  ): { id: number; dismiss: () => void; update: (props: ToastProps) => void; };
  
  toast.promise = function<T>(
    promise: Promise<T>,
    options: {
      loading: ReactNode | ToastProps;
      success: ReactNode | ToastProps | ((data: T) => ReactNode | ToastProps);
      error: ReactNode | ToastProps | ((error: unknown) => ReactNode | ToastProps);
    }
  ): Promise<T>;

  export function Toaster(props: ToasterProps): JSX.Element;
  
  export default { toast, Toaster };
}

declare module 'vaul' {
  import { ReactNode } from 'react';

  export interface DrawerProps {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    nested?: boolean;
    dismissible?: boolean;
    direction?: 'top' | 'bottom' | 'left' | 'right';
    snapPoints?: number[];
    activeSnapPoint?: number | null;
    setActiveSnapPoint?: (snapPoint: number | null) => void;
    closeThreshold?: number;
    shouldScaleBackground?: boolean;
    scrollLockTimeout?: number;
    fixed?: boolean;
  }

  export interface DrawerContentProps {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface DrawerTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }

  export function Drawer(props: DrawerProps): JSX.Element;
  Drawer.Content = function Content(props: DrawerContentProps): JSX.Element;
  Drawer.Trigger = function Trigger(props: DrawerTriggerProps): JSX.Element;
  Drawer.Portal = function Portal(props: { children: ReactNode }): JSX.Element;
  Drawer.Overlay = function Overlay(props: { className?: string }): JSX.Element;

  export function useDrawer(): {
    open: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
  };
}

declare module 'react-day-picker' {
  import { ReactNode, ComponentPropsWithRef, ReactElement } from 'react';
  
  export interface DayPickerProps {
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from: Date; to: Date };
    onSelect?: (date: Date | undefined) => void;
    disabled?: Date[] | ((date: Date) => boolean);
    hidden?: Date[] | ((date: Date) => boolean);
    month?: Date;
    defaultMonth?: Date;
    fromMonth?: Date;
    toMonth?: Date;
    captionLayout?: 'dropdown' | 'buttons';
    classNames?: Record<string, string>;
    className?: string;
    style?: React.CSSProperties;
    components?: Record<string, React.ComponentType<any>>;
    modifiersClassNames?: Record<string, string>;
    modifiersStyles?: Record<string, React.CSSProperties>;
    showOutsideDays?: boolean;
    fixedWeeks?: boolean;
    formatters?: Record<string, (...args: any[]) => string>;
    labels?: Record<string, string | ((...args: any[]) => string)>;
    footer?: ReactNode;
  }
  
  export function DayPicker(props: DayPickerProps): JSX.Element;
  
  export namespace DateFormatter {
    function format(date: Date, format: string): string;
    function parse(str: string, format: string): Date;
  }
}

// Fix for Radix UI dropdown menu issue
declare module '@radix-ui/react-dropdown-menu' {
  import { ReactNode, RefAttributes, ForwardedRef } from 'react';
  
  export interface DropdownMenuProps {
    children?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    dir?: 'ltr' | 'rtl';
  }
  
  export interface DropdownMenuTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface DropdownMenuContentProps {
    children?: ReactNode;
    asChild?: boolean;
    loop?: boolean;
    onCloseAutoFocus?: (event: Event) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
    onFocusOutside?: (event: FocusEvent) => void;
    onInteractOutside?: (event: React.SyntheticEvent) => void;
    portalled?: boolean;
    forceMount?: true;
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionTolerance?: number;
  }
  
  export interface DropdownMenuItemProps {
    children?: ReactNode;
    disabled?: boolean;
    onSelect?: (event: Event) => void;
    textValue?: string;
    asChild?: boolean;
  }

  export function Root(props: DropdownMenuProps): JSX.Element;
  export function Trigger(props: DropdownMenuTriggerProps): JSX.Element;
  export function Content(props: DropdownMenuContentProps): JSX.Element;
  export function Item(props: DropdownMenuItemProps): JSX.Element;
  
  // Add other components as needed
  export function Group(props: { children: ReactNode; className?: string }): JSX.Element;
  export function Label(props: { children: ReactNode; className?: string }): JSX.Element;
  export function CheckboxItem(props: { children: ReactNode; className?: string; checked?: boolean; onCheckedChange?: (checked: boolean) => void }): JSX.Element;
  export function RadioItem(props: { children: ReactNode; className?: string; value: string }): JSX.Element;
  export function RadioGroup(props: { children: ReactNode; value?: string; onValueChange?: (value: string) => void }): JSX.Element;
  export function Separator(props: { className?: string }): JSX.Element;
  export function Arrow(props: { className?: string }): JSX.Element;
}

// Fix for Radix UI's component props
declare module '@radix-ui/react-tooltip' {
  import { ReactNode } from 'react';
  
  export interface TooltipProps {
    children?: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    delayDuration?: number;
    disableHoverableContent?: boolean;
  }
  
  export interface TooltipTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface TooltipContentProps {
    children?: ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    arrowPadding?: number;
    sticky?: 'partial' | 'always';
    hideWhenDetached?: boolean;
  }
  
  export function Provider(props: { children: ReactNode }): JSX.Element;
  export function Root(props: TooltipProps): JSX.Element;
  export function Trigger(props: TooltipTriggerProps): JSX.Element;
  export function Content(props: TooltipContentProps): JSX.Element;
}

declare module '@radix-ui/react-tabs' {
  import { ReactNode } from 'react';
  
  export interface TabsProps {
    children?: ReactNode;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    activationMode?: 'automatic' | 'manual';
  }
  
  export interface TabsListProps {
    children?: ReactNode;
    loop?: boolean;
  }
  
  export interface TabsTriggerProps {
    children?: ReactNode;
    value: string;
    disabled?: boolean;
    asChild?: boolean;
  }
  
  export interface TabsContentProps {
    children?: ReactNode;
    value: string;
    asChild?: boolean;
    forceMount?: boolean;
  }
  
  export function Root(props: TabsProps): JSX.Element;
  export function List(props: TabsListProps): JSX.Element;
  export function Trigger(props: TabsTriggerProps): JSX.Element;
  export function Content(props: TabsContentProps): JSX.Element;
}

declare module '@radix-ui/react-collapsible' {
  import { ReactNode } from 'react';
  
  export interface CollapsibleProps {
    children?: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
  }
  
  export interface CollapsibleTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface CollapsibleContentProps {
    children?: ReactNode;
    asChild?: boolean;
    forceMount?: boolean;
  }
  
  export function Root(props: CollapsibleProps): JSX.Element;
  export function Trigger(props: CollapsibleTriggerProps): JSX.Element;
  export function Content(props: CollapsibleContentProps): JSX.Element;
}

declare module '@radix-ui/react-alert-dialog' {
  import { ReactNode } from 'react';
  
  export interface AlertDialogProps {
    children?: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  
  export interface AlertDialogTriggerProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface AlertDialogContentProps {
    children?: ReactNode;
    forceMount?: boolean;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
  }
  
  export interface AlertDialogTitleProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface AlertDialogDescriptionProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface AlertDialogActionProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface AlertDialogCancelProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export function Root(props: AlertDialogProps): JSX.Element;
  export function Trigger(props: AlertDialogTriggerProps): JSX.Element;
  export function Content(props: AlertDialogContentProps): JSX.Element;
  export function Title(props: AlertDialogTitleProps): JSX.Element;
  export function Description(props: AlertDialogDescriptionProps): JSX.Element;
  export function Action(props: AlertDialogActionProps): JSX.Element;
  export function Cancel(props: AlertDialogCancelProps): JSX.Element;
}

declare module '@radix-ui/react-avatar' {
  import { ReactNode } from 'react';
  
  export interface AvatarProps {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  export interface AvatarImageProps {
    children?: ReactNode;
    src?: string;
    alt?: string;
    onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
  }
  
  export interface AvatarFallbackProps {
    children?: ReactNode;
    asChild?: boolean;
    delayMs?: number;
  }
  
  export function Root(props: AvatarProps): JSX.Element;
  export function Image(props: AvatarImageProps): JSX.Element;
  export function Fallback(props: AvatarFallbackProps): JSX.Element;
}

declare module '@radix-ui/react-slider' {
  export interface SliderProps {
    defaultValue?: number[];
    value?: number[];
    onValueChange?: (value: number[]) => void;
    onValueCommit?: (value: number[]) => void;
    name?: string;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    min?: number;
    max?: number;
    step?: number;
    minStepsBetweenThumbs?: number;
    inverted?: boolean;
    className?: string;
  }
  
  export const Root: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLSpanElement>>;
  export const Track: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>;
  export const Range: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>;
  export const Thumb: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>;
}

declare module 'tailwind-merge' {
  export function twMerge(...classLists: (string | undefined | null | false)[]): string;
  export function twJoin(...classLists: (string | undefined | null | false)[]): string;
}
