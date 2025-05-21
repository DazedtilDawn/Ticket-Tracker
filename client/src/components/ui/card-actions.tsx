import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useMobile } from '@/context/MobileContext';

interface ActionItem {
  label: string;
  onSelect: () => void;
  className?: string;
  icon?: React.ReactNode;
}

interface CardActionsProps {
  items: ActionItem[];
  triggerIcon?: React.ReactNode;
}

export function CardActions({ items, triggerIcon }: CardActionsProps) {
  const { isMobile } = useMobile();

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
            {triggerIcon || <MoreVertical className="h-4 w-4" />}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Actions</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-0">
            {items.map((item, index) => (
              <DrawerClose key={index} asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start mb-2 ${item.className || ''}`}
                  onClick={item.onSelect}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Button>
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
          {triggerIcon || <MoreVertical className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onSelect}
            className={`cursor-pointer ${item.className || ''}`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
