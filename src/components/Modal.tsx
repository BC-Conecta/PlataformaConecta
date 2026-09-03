import { X } from "lucide-react";
import type { ReactNode } from "react";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <header>
          <h2>{title}</h2>
          <button className="icon" onClick={onClose}>
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
