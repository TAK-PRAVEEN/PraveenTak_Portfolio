import InteractiveCard from "@/components/InteractiveCard";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SkillCardProps {
  title: string;
  skills: string[];
  icon: LucideIcon;
  gradient?: string;
}

const SkillCard = ({ title, skills, icon: Icon, gradient = "bg-gradient-card" }: SkillCardProps) => {
  return (
    <InteractiveCard className={`p-6 ${gradient}`} glowIntensity="medium">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20 shadow-glow group-hover:bg-primary/30 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs bg-muted/50 hover:bg-primary/20 hover:text-primary transition-smooth cursor-default hover:scale-110 hover:shadow-sm"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </InteractiveCard>
  );
};

export default SkillCard;