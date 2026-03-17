export interface LightboxImage {
  id: number
  url: string
  alt: string
}

export interface ImageLightboxProps {
  images: LightboxImage[]
  isOpen: boolean
  initialIndex: number
  onClose: () => void
  onNavigate?: (index: number) => void
}
