"use client"

import { Activity, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { Button } from "../ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu"
import { Separator } from "../ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"


const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/fea-core", label: "FEA Core" },
  { href: "/sfi", label: "SFI" },
] as const

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <div className="flex items-center justify-between gap-4 w-full p-4 lg:p-6 border-b border">
      {/* Logo + Desktop Nav */}
      <div className="flex items-center h-12 gap-4">
        <div className="pl-4">
          <Activity />
        </div>
        <Separator orientation="vertical" className="bg-border hidden md:block" />
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2 lg:gap-6">
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild active={isActive(link.href)}>
                  <Link
                    href={link.href}
                    className={cn(
                      isActive(link.href) ? "font-semibold text-primary" : "text-muted-foreground",
                      "px-2 py-2 md:px-3 "
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="hidden md:flex gap-4">
        <Button size="lg" variant="outline">Submit a Project</Button>
        <Button size="lg" variant="outline">Login</Button>
        <Button size="lg" variant="default">Sign Up</Button>
      </div>

      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(link.href) &&
                    "bg-accent/50 font-semibold text-primary"
                  )}
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 p-4">
            <Button variant="outline" className="w-full">Submit a Project</Button>
            <Button variant="outline" className="w-full">Login</Button>
            <Button variant="default" className="w-full">Sign Up</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
