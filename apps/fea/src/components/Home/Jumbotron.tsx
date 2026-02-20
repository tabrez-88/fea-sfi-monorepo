"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { CircleCheck, FileText, Layers2, LockKeyhole, Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import studioPic from "../../../public/assets/studio.jpg";

const slides = [
  {
    image: studioPic,
    title: "Bassline Studio",
    category: "Creator Projects",
    region: "Europe",
  },
  {
    image: studioPic,
    title: "Motion Picture Fund",
    category: "Film Production",
    region: "North America",
  },
  {
    image: studioPic,
    title: "Digital Arts Collective",
    category: "Digital Media",
    region: "Asia",
  },
  {
    image: studioPic,
    title: "Festival Entertainment",
    category: "Event Production",
    region: "Africa",
  },
];

export default function Jumbotron() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 7000, stopOnInteraction: false }),
  ]);
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

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section className="flex gap-10">
      <div className="flex flex-col size-full basis-2/3 gap-12">
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap gap-2 md:gap-3">
            <Badge variant="outline" className="font-bold">
              <CircleCheck fill="black" color="white" data-icon="inline-start" />
              KYC Verified
            </Badge>
            <Badge variant="outline" className="font-bold">
              <LockKeyhole data-icon="inline-start" />
              Escrow-Backed
            </Badge>
            <Badge variant="outline" className="font-bold">
              <Layers2 data-icon="inline-start" />
              Transparent
            </Badge>
            <Badge variant="outline" className="font-bold">
              <FileText data-icon="inline-start" />
              Compilant
            </Badge>
          </div>
          <div>
            <p className="text-[64px] font-extralight leading-tight">
              <span className="font-bold tracking-tight">Support</span> the Future of Entertainment
            </p>
            <p className="text-muted-foreground">
              Discover exclusive perks and participate in global
              entertainment projects through clearly defined contractual structures.
              Transparent, verified, and community-driven.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button size="lg">
            Explore Projects
          </Button>
          <Button size="lg" variant="outline">
            How it works
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <AvatarGroup className="grayscale">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <div className="flex flex-col">
            <p className="text-sm font-bold">10.5k+</p>
            <p className="text-xs text-muted-foreground">
              Community Members
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col size-full basis-1/3 gap-4 relative">
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, index) => (
              <div key={index} className="flex-[0_0_100%] w-32">
                <div className="relative w-full h-88 aspect-square overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[20px] font-bold">
              {slides[selectedIndex]?.title}
            </p>
            <p className="font-bold text-[#4D4D4D] flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {slides[selectedIndex]?.category}
              <span className="text-[#B3B3B3] mx-0.5">|</span>
              {slides[selectedIndex]?.region}
            </p>
          </div>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`rounded-full cursor-pointer transition-all duration-300 ${
                index === selectedIndex
                  ? "w-6 h-2.5 bg-black"
                  : "size-2.5 bg-[#D9D9D9]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
