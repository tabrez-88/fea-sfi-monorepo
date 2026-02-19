import { CircleCheck, Gift, Hash, LockKeyhole } from "lucide-react";

import ImageGrid from "@/components/Home/ImageGrid";
import Jumbotron from "@/components/Home/Jumbotron";
import Container from "@/components/shared/Container";

export default function HomePage() {
  return (
    <Container>
      <Jumbotron />
      <div className="grid grid-cols-3 gap-6">
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <Gift className="size-6" />
          </div>
          <p className="text-xl font-bold">Exclusive Perks & Access</p>
          <p className="text-muted-foreground leading-relaxed">Get closer to the action. Unlock behind-the-scenes content, limited collectibles, and premiere invites just for backers.</p>
        </div>
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <LockKeyhole className="size-6" />
          </div>
          <p className="text-xl font-bold">Exclusive Perks & Access</p>
          <p className="text-muted-foreground leading-relaxed">Get closer to the action. Unlock behind-the-scenes content, limited collectibles, and premiere invites just for backers.</p>
        </div>
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <Hash className="size-6" />
          </div>
          <p className="text-xl font-bold">Exclusive Perks & Access</p>
          <p className="text-muted-foreground leading-relaxed">Get closer to the action. Unlock behind-the-scenes content, limited collectibles, and premiere invites just for backers.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 w-full gap-6">
        <ImageGrid />
        <div className="flex flex-col justify-between gap-8">
          <div className="flex flex-col">
            <p className="text-[20px] text-muted-foreground font-bold">Discover the Future of Entertainment</p>
            <h4 className="text-[40px] font-extralight">A Modern platform for <span className="font-bold">creative</span> projects</h4>
          </div>
          <div className="flex gap-2 items-start w-full ">
            <CircleCheck fill="#000000" color="white" className="size-8" />
            <div className="flex flex-col gap-2">
              <h5 className="text-[20px] font-bold">Transparent, secure, and community-driven.</h5>
              <p className="text-muted-foreground">
                Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex gap-2 items-start w-full ">
              <CircleCheck fill="#000000" color="white" className="size-8" />
              <div className="flex flex-col gap-2">
                <h5 className="text-[20px] font-bold">Transparent, secure, and community-driven.</h5>
                <p className="text-muted-foreground">
                  Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation.
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start w-full ">
              <CircleCheck fill="#000000" color="white" className="size-8" />
              <div className="flex flex-col gap-2">
                <h5 className="text-[20px] font-bold">Transparent, secure, and community-driven.</h5>
                <p className="text-muted-foreground">
                  Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation.
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start w-full ">
              <CircleCheck fill="#000000" color="white" className="size-8" />
              <div className="flex flex-col gap-2">
                <h5 className="text-[20px] font-bold">Transparent, secure, and community-driven.</h5>
                <p className="text-muted-foreground">
                  Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation.
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start w-full ">
              <CircleCheck fill="#000000" color="white" className="size-8" />
              <div className="flex flex-col gap-2">
                <h5 className="text-[20px] font-bold">Transparent, secure, and community-driven.</h5>
                <p className="text-muted-foreground">
                  Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
