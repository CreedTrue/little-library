"use client";

import Image from "next/image";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isLoggedIn = status === "authenticated";

  // Debug: Log session data to help troubleshoot
  useEffect(() => {
    console.log("Navbar - Session status:", status);
    console.log("Navbar - Session data:", session);
    if (session?.user) {
      console.log("Navbar - User role:", session.user.role);
      console.log("Navbar - Is admin:", session.user.role === "ADMIN");
    }
  }, [session, status]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/">
            <Image src="/bound-high-resolution-logo-transparent.png" alt="Logo" width={32} height={32} />
          </NavigationMenuLink>
        </NavigationMenuItem>
        {!isAuthPage && isLoggedIn && (
          <>
            <NavigationMenuItem>
              <NavigationMenuLink href="/library">Library</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/dashboard">Dashboard</NavigationMenuLink>
            </NavigationMenuItem>
            {session?.user?.role === "ADMIN" && (
              <NavigationMenuItem>
                <NavigationMenuLink href="/admin/invite">Invite Users</NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </>
        )}
        {isLoggedIn && (
          <NavigationMenuItem className="ml-auto">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="text-sm"
            >
              Sign Out
            </Button>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
} 