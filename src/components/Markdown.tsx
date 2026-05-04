import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

type Props = {
  source: string;
};

export function Markdown({ source }: Props) {
  const html = useMemo(() => {
    const raw = marked.parse(source, { async: false });
    return DOMPurify.sanitize(raw);
  }, [source]);

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
