// Image style configurations for artist photos
export type ImageStyle = 'square' | 'portrait' | 'landscape' | 'circle';

export interface ImageStyleConfig {
  aspectRatio: string;
  className: string;
  gridHeight: string;
  detailSize: string;
  description: string;
}

export const imageStyleConfigs: Record<ImageStyle, ImageStyleConfig> = {
  square: {
    aspectRatio: 'aspect-square',
    className: 'rounded-lg',
    gridHeight: 'h-64',
    detailSize: 'h-96',
    description: 'Square (1:1) - Classic profile style'
  },
  portrait: {
    aspectRatio: 'aspect-[3/4]',
    className: 'rounded-lg',
    gridHeight: 'h-72',
    detailSize: 'h-[32rem]',
    description: 'Portrait (3:4) - Vertical orientation'
  },
  landscape: {
    aspectRatio: 'aspect-[4/3]',
    className: 'rounded-lg',
    gridHeight: 'h-56',
    detailSize: 'h-80',
    description: 'Landscape (4:3) - Horizontal orientation'
  },
  circle: {
    aspectRatio: 'aspect-square',
    className: 'rounded-full',
    gridHeight: 'h-64',
    detailSize: 'h-96',
    description: 'Circle - Round profile photo'
  }
};

/**
 * Get image style classes for artist photos
 * @param style - The image style to use
 * @param context - Where the image is being used ('grid', 'detail', 'thumbnail')
 * @returns CSS classes for the image container
 */
export function getImageStyleClasses(
  style: ImageStyle = 'square',
  context: 'grid' | 'detail' | 'thumbnail' = 'grid'
): string {
  const config = imageStyleConfigs[style];
  
  // For grid context, we use fixed heights to prevent layout issues
  // but still apply the appropriate border radius for the style
  switch (context) {
    case 'grid':
      return `w-full ${config.gridHeight} ${config.className} overflow-hidden bg-gray-200 relative`;
    case 'detail':
      return `w-full ${config.aspectRatio} ${config.className} overflow-hidden bg-gray-200 relative`;
    case 'thumbnail':
      return `w-16 h-16 ${config.className} overflow-hidden bg-gray-200 relative`;
    default:
      return `${config.aspectRatio} ${config.className} overflow-hidden bg-gray-200 relative`;
  }
}

/**
 * Get all available image style options for form dropdowns
 */
export function getImageStyleOptions(): Array<{ value: ImageStyle; label: string; description: string }> {
  return Object.entries(imageStyleConfigs).map(([value, config]) => ({
    value: value as ImageStyle,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    description: config.description
  }));
}

/**
 * Get recommended image dimensions for a given style
 */
export function getRecommendedDimensions(style: ImageStyle): { width: number; height: number; ratio: string } {
  switch (style) {
    case 'square':
    case 'circle':
      return { width: 400, height: 400, ratio: '1:1' };
    case 'portrait':
      return { width: 300, height: 400, ratio: '3:4' };
    case 'landscape':
      return { width: 400, height: 300, ratio: '4:3' };
    default:
      return { width: 400, height: 400, ratio: '1:1' };
  }
}
