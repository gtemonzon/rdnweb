import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

interface PartnersCarouselProps {
  partners: Partner[];
}

const PartnersCarousel = ({ partners }: PartnersCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start",
      skipSnaps: false,
      dragFree: true,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const defaultPartners = ["ACNUR", "Plan International", "UNICEF", "Save the Children", "World Vision"];
  const displayPartners = partners.length > 0 ? partners : null;

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {displayPartners
          ? displayPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex-shrink-0 min-w-0 px-4 md:px-6"
                style={{ flexBasis: "auto" }}
              >
                {partner.logo_url && partner.logo_url !== "/placeholder.svg" ? (
                  <a
                    href={partner.website_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block opacity-70 hover:opacity-100 transition-opacity duration-300"
                  >
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="h-14 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </a>
                ) : (
                  <a
                    href={partner.website_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground font-semibold text-lg opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    {partner.name}
                  </a>
                )}
              </div>
            ))
          : defaultPartners.map((name) => (
              <div
                key={name}
                className="flex-shrink-0 min-w-0 px-4 md:px-6"
                style={{ flexBasis: "auto" }}
              >
                <span className="text-muted-foreground font-semibold text-lg opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">
                  {name}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
};

export default PartnersCarousel;
