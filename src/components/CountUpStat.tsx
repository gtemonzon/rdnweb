import { useCountUp, parseStatNumber } from "@/hooks/useCountUp";

interface CountUpStatProps {
  number: string;
  label: string;
}

const CountUpStat = ({ number, label }: CountUpStatProps) => {
  const { number: endNumber, suffix, prefix } = parseStatNumber(number);
  const { formattedCount, elementRef } = useCountUp({
    end: endNumber,
    duration: 2500,
    suffix,
    prefix,
  });

  return (
    <div ref={elementRef} className="text-center">
      <div className="font-heading text-4xl md:text-5xl font-bold mb-2">
        {formattedCount}
      </div>
      <div className="text-primary-foreground/80 text-sm md:text-base">
        {label}
      </div>
    </div>
  );
};

export default CountUpStat;
