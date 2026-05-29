type RoleNameChipProps = Readonly<{
  roleName: string;
}>;

/**
 * Outlined chip for the free-text Role Name field. Shared across the
 * Participants list table and the CSV preview / import-complete tables so
 * the visual treatment for a role label is consistent everywhere it
 * appears.
 */
export function RoleNameChip({ roleName }: RoleNameChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[12px] border border-black bg-white px-3 py-[2px] text-[13px] font-medium text-foreground">
      <span className="truncate">{roleName}</span>
    </span>
  );
}
