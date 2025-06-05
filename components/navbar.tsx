"use client";

import Image from "next/image";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/">
            <Image src="/bound-high-resolution-logo-transparent.png" alt="Logo" width={32} height={32} />
          </NavigationMenuLink>
        </NavigationMenuItem>
        {!isAuthPage && (
          <>
            <NavigationMenuItem>
              <NavigationMenuLink href="/library">Library</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/dashboard">Dashboard</NavigationMenuLink>
            </NavigationMenuItem>
          </>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
} 