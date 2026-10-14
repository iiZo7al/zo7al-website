import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownUrl } from "@/lib/data/markdown";

const components: Components = {
  a: ({ href, children, title }) => href ? <a href={href} title={title} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noopener noreferrer ugc">{children}</a> : <span>{children}</span>,
  // Author-supplied Markdown images have no executable HTML or event handlers.
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, title }) => typeof src === "string" && src ? <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <span>{alt}</span>,
  table: ({ children }) => <div className="markdown-table-scroll"><table>{children}</table></div>,
};

export default function MarkdownContent({ children, className = "", inline = false }: { children?: string | null; className?: string; inline?: boolean }) {
  const content = <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={(url, key) => markdownUrl(url, key === "src")} components={components} {...(inline ? { allowedElements: ["strong", "em", "del", "code", "br"], unwrapDisallowed: true } : {})}>{children ?? ""}</ReactMarkdown>;
  return inline ? <span className={"markdown-inline " + className} dir="auto">{content}</span> : <div className={"markdown-content " + className} dir="auto">{content}</div>;
}
