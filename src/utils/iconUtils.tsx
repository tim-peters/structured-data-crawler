import { 
  PieChart, Bird, Newspaper, Book, Calendar, HelpCircle, Hammer, Briefcase, 
  Store, Film, GitBranch, Users, Package, ChefHat, Star, Play, FileText, 
  Globe, List, Tag, PenLine, Image, Mic, Database 
} from 'lucide-react';

export const snippetTypeIcons: { types: string[]; icon: React.ElementType }[] = [
  { types: ['OpenGraph'], icon: PieChart },
  { types: ['TwitterCard'], icon: Bird },
  { types: ['Article', 'NewsArticle', 'BlogPosting'], icon: Newspaper },
  { types: ['Book'], icon: Book },
  { types: ['Event'], icon: Calendar },
  { types: ['FAQ'], icon: HelpCircle },
  { types: ['HowTo'], icon: Hammer },
  { types: ['JobPosting'], icon: Briefcase },
  { types: ['LocalBusiness', 'Restaurant'], icon: Store },
  { types: ['Movie'], icon: Film },
  { types: ['Organization'], icon: GitBranch },
  { types: ['Person', 'ProfilePage'], icon: Users },
  { types: ['Product'], icon: Package },
  { types: ['Recipe'], icon: ChefHat },
  { types: ['Review', 'AggregateRating'], icon: Star },
  { types: ['VideoObject'], icon: Play },
  { types: ['WebPage'], icon: FileText },
  { types: ['WebSite'], icon: Globe },
  { types: ['BreadcrumbList'], icon: List },
  { types: ['Offer'], icon: Tag },
  { types: ['CreativeWork'], icon: PenLine },
  { types: ['ImageObject'], icon: Image },
  { types: ['Podcast'], icon: Mic },
];

export function getSnippetIcon(
  type: string, 
  fallbackIcon?: React.ElementType,
  className: string = "w-5 h-5 text-slate-600"
) {
  const entry = snippetTypeIcons.find(e => e.types.includes(type));
  const IconComponent = entry ? entry.icon : (fallbackIcon || Database);
  return <IconComponent className={className} />;
}