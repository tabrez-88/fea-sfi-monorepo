'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useLogout } from '@/hooks/auth/useLogout';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'U';
}

export function UserMenu() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-[48px] rounded-full" />
        <Skeleton className="size-6 rounded" />
      </div>
    );
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push(ROUTES.LOGIN),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="size-[48px]">
          {user?.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-grey-50 text-[14px] font-medium text-foreground">
            {user ? getInitials(user.name) : <UserIcon className="size-5" />}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="size-6 text-foreground" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-[14px] font-medium">{user.name}</span>
            <span className="text-[12px] font-normal text-neutral">
              {user.email}
            </span>
          </DropdownMenuLabel>
        ) : (
          <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          disabled={logout.isPending}
          className="text-danger focus:text-danger"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
