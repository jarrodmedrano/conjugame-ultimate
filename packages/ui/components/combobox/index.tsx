import { useState } from 'react'
import { Button } from '../ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { BookPlus, ChevronDown } from 'lucide-react'
import { ComboList } from './ComboList'

const extraItems = [
  {
    name: 'new',
    label: 'Add New',
    Icon: BookPlus,
    href: '#',
    onSelect: () => {},
  },
]
function ComboBoxResponsive({
  page,
  onAdd,
}: {
  page: any
  onAdd: (_pageName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isDesktop = true
  const [selectedStatus, setSelectedItem] = useState<any | null>(null)

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between capitalize"
          >
            {selectedStatus ? <>{selectedStatus.label}</> : <>+ {page.title}</>}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <ComboList
            page={page}
            setOpen={setOpen}
            setSelectedItem={setSelectedItem}
            items={extraItems.map((item) => ({
              ...item,
              onSelect: onAdd,
              href: `/create/${page.href}`,
              name: page.title,
            }))}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedStatus ? <>{selectedStatus.label}</> : <>+ {page.title}</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <ComboList
            page={page}
            setOpen={setOpen}
            setSelectedItem={setSelectedItem}
            items={extraItems.map((item) => ({
              ...item,
              onSelect: onAdd,
              href: `/create/${page.href}`,
              name: page.title,
            }))}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default ComboBoxResponsive
