import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";

interface TimelineItemProps {
  title: string;
  company: string;
  period: string;
  location?: string;
  description: string[];
  technologies?: string[];
  type: "work" | "education" | "project";
}

const TimelineItem = ({ title, company, period, location, description, technologies, type }: TimelineItemProps) => {
  return (
    <div className="flex space-x-4 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${
          type === 'work' ? 'bg-primary shadow-glow' : 
          type === 'education' ? 'bg-secondary' : 'bg-accent'
        }`} />
        <div className="w-px bg-border flex-1 mt-2" />
      </div>
      
      <Card className="glass-hover p-6 bg-gradient-card hover-lift flex-1 mb-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            <p className="text-primary font-medium">{company}</p>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CalendarDays className="w-4 h-4" />
                <span>{period}</span>
              </div>
              {location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {description.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {technologies && (
            <div className="flex flex-wrap gap-2 pt-2">
              {technologies.map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-muted/50"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TimelineItem;