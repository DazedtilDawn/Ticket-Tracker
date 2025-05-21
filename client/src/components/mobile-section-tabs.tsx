import { useEffect, useState } from "react";
import clsx from "clsx";

const SECTIONS = [
  { id: "chores", label: "Chores" },
  { id: "activity", label: "Activity" },
];

export default function MobileSectionTabs() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="child-tabs sticky top-14 z-20 bg-background/80 backdrop-blur flex gap-6 justify-center text-sm py-2 border-b">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={clsx(
            "pb-1",
            active === id
              ? "font-semibold text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
