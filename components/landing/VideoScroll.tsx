"use client";

import * as React from "react";
import {
  MotionValue,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react";

interface ContainerScrollValue {
  scrollYProgress: MotionValue<number>;
}

const ContainerScrollContext = React.createContext<
  ContainerScrollValue | undefined
>(undefined);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within <ContainerScroll>"
    );
  }
  return context;
}

interface ContainerScrollProps extends React.HTMLAttributes<HTMLDivElement> {}

const ContainerScroll = ({
  children,
  className,
  ...props
}: ContainerScrollProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <section
        className={`relative min-h-[220vh] w-full ${className ?? ""}`}
        {...props}
        ref={scrollRef}
      >
        {/* Sticky wrapper keeps the video pinned in the viewport while the section scrolls */}
        <div className="sticky top-0 h-screen flex items-start justify-center pt-4 overflow-hidden">
          {children}
        </div>
      </section>
    </ContainerScrollContext.Provider>
  );
};

interface ContainerInsetProps {
  insetYRange?: [number, number];
  insetXRange?: [number, number];
  roundednessRange?: [number, number];
  children: React.ReactNode;
  className?: string;
}

const ContainerInset = ({
  insetYRange = [30, 0],
  insetXRange = [25, 0],
  roundednessRange = [24, 12],
  children,
  className,
}: ContainerInsetProps) => {
  const { scrollYProgress } = useContainerScrollContext();

  // Animation runs from 15% → 85% of the section's scroll travel
  const insetY = useTransform(scrollYProgress, [0.15, 0.65], insetYRange);
  const insetX = useTransform(scrollYProgress, [0.15, 0.65], insetXRange);
  const roundedness = useTransform(scrollYProgress, [0.15, 0.65], roundednessRange);
  const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${roundedness}px)`;

  return (
    <motion.div
      className={`w-full origin-center overflow-hidden ${className ?? ""}`}
      style={{ clipPath }}
    >
      {children}
    </motion.div>
  );
};

export { ContainerScroll, ContainerInset };
