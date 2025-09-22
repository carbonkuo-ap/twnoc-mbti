import { useRef, useState, useEffect } from "react";

export default function useHeadingsObserver() {
  const observer = useRef<IntersectionObserver>();
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleObserver: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry?.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: "-10% 0% -80% 0px",
      threshold: 0.1,
    });

    const elements = document.querySelectorAll("h2");

    elements.forEach((element) => observer.current?.observe(element));

    return () => observer.current?.disconnect();
  }, []);

  return {
    activeId,
    setActiveId,
  };
}
