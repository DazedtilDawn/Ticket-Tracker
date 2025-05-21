import { useEffect, useState } from "react";
import clsx from "clsx";
import { scrollToHash } from "@/lib/scrollToHash";

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

  const handleTabClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    scrollToHash(id);
    // Optional: provide haptic feedback on mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className="child-tabs sticky top-14 z-20 bg-background/80 backdrop-blur flex gap-6 justify-center text-sm py-2 border-b">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={(e) => handleTabClick(id, e)}
          className={clsx(
            "pb-1 appearance-none bg-transparent border-0 cursor-pointer",
            active === id
              ? "font-semibold text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
