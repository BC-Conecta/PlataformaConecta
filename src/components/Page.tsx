import type { ReactNode } from "react";
export function Page({
  tag,
  title,
  text,
  action,
  children,
}: {
  tag: string;
  title: string;
  text: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <b>{tag}</b>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
