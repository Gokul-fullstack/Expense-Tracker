import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name, className, size = 20, color }: CategoryIconProps) {
  const IconComponent = (Icons as any)[name];
  const style = color ? { color } : undefined;
  if (!IconComponent) {
    const Fallback = Icons.HelpCircle;
    return <Fallback className={className} size={size} style={style} />;
  }
  return <IconComponent className={className} size={size} style={style} />;
}

export default CategoryIcon;
