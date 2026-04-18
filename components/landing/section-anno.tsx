// ABOUTME: Dimension-line section annotation used above every landing section heading.
// ABOUTME: Renders as mono uppercase with flanking 1px teal lines via the .anno utility.
interface SectionAnnoProps {
  number: number;
  name: string;
}

export function SectionAnno({ number, name }: SectionAnnoProps) {
  const padded = String(number).padStart(2, '0');
  return (
    <p className="anno">
      SECTION {padded} / {name.toUpperCase()}
    </p>
  );
}
