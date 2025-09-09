import InteractiveCard from "@/components/InteractiveCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  technologies: string[];
  features: string[];
  links?: {
    demo?: string;
    github?: string;
  };
}

const ProjectCard = ({ title, description, technologies, features, links }: ProjectCardProps) => {
  return (
    <InteractiveCard className="p-6 bg-gradient-card group" glowIntensity="high">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs border-primary/30 text-primary bg-primary/10"
              >
                {tech}
              </Badge>
            ))}
          </div>

          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {links && (
          <div className="flex space-x-3 pt-2">
            {links.github && (
              <a href={links.github} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="hover-scale">
                  <Github className="w-4 h-4 mr-2" />
                  Code
                </Button>
              </a>
            )}
            {links.demo && (
              <a href={links.demo} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="hover-scale">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Demo
                </Button>
              </a>
            )}
          </div>
        )}

      </div>
    </InteractiveCard>
  );
};

export default ProjectCard;