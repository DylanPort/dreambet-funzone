
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:border-white/10",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          info: "group toast group-[.toaster]:bg-blue-900/50 group-[.toaster]:border-blue-800 group-[.toaster]:text-white",
          success: "group toast group-[.toaster]:bg-green-900/50 group-[.toaster]:border-green-800 group-[.toaster]:text-white",
          error: "group toast group-[.toaster]:bg-red-900/50 group-[.toaster]:border-red-800 group-[.toaster]:text-white",
        },
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster };
