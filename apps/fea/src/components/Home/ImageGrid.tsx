import Image, { type StaticImageData } from "next/image";

import studioPic from "../../../public/assets/studio.jpg";

interface GridImage {
  src: StaticImageData | string;
  alt: string;
  className?: string;
}

const images: GridImage[] = [
  { src: studioPic, alt: "Film set production", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Fantasy game world", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Sunset cityscape", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Sensation poster", className: "col-span-1 row-span-2" },
  { src: studioPic, alt: "Romantic drama scene", className: "col-span-2 row-span-1" },
  { src: studioPic, alt: "Lost in Stars poster", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Animated scene", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Camera crew filming", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Dark cinematic scene", className: "col-span-2 row-span-1" },
  { src: studioPic, alt: "Crystal artwork", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Portrait of creator", className: "col-span-1 row-span-1" },
  { src: studioPic, alt: "Camera equipment", className: "col-span-2 row-span-1" },
];

export default function ImageGrid() {
  return (
    <div className="grid w-full grid-cols-4 auto-rows-[180px] gap-3">
      {images.map((image, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-2xl ${image.className}`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
