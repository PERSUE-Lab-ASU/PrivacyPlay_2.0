import type { ReactNode } from "react";
import { SectionHeader } from "./SectionHeader";
import type { SectionDef } from "@/lib/sections";

interface Props {
  section: SectionDef;
  children: ReactNode;
  /** Skip the header (rare — for sections where content itself opens with the header) */
  skipHeader?: boolean;
}

/**
 * SectionShell — wraps an existing scene with its numbered SectionHeader
 * card and a stable anchor id. Content stays exactly as authored below.
 */
export function SectionShell({ section, children, skipHeader = false }: Props) {
  return (
    <>
      {!skipHeader && (
        <SectionHeader
          num={section.num}
          title={section.title}
          subtitle={section.subtitle}
          anchorId={section.id}
        />
      )}
      <div id={skipHeader ? section.id : undefined}>{children}</div>
    </>
  );
}
