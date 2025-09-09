import Navigation from "@/components/Navigation";
import ProjectCard from "@/components/ProjectCard";
import TimelineItem from "@/components/TimelineItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Award, 
  BookOpen, 
  Calendar,
  ExternalLink
} from "lucide-react";

const Experience = () => {
  const workExperience = [
    {
      title: "Project Trainee",
      company: "Defence Research and Development Organisation (DRDO)",
      period: "Feb 2025 - Apr 2025",
      location: "Jodhpur, India",
      description: [
        "Worked on Machine Learning and Computer Vision projects for defense applications",
        "Implemented deep learning algorithms for image analysis and pattern recognition",
        "Collaborated with research teams on cutting-edge defense technology solutions"
      ],
      technologies: ["Machine Learning", "Computer Vision", "Deep Learning"],
      type: "work" as const
    },
    {
      title: "Student Intern",
      company: "PW (PhysicsWallah)",
      period: "Jan 2025 - Feb 2025",
      location: "Remote",
      description: [
        "Developed machine learning solutions for palatable food data analysis",
        "Created predictive models for food industry analysis",
        "Implemented data preprocessing and feature engineering pipelines"
      ],
      technologies: ["Machine Learning", "Python", "Data Analysis"],
      type: "work" as const
    }
  ];

  const education = [
    {
      title: "Master of Computer Application",
      company: "Poornima University, Jaipur",
      period: "Aug 2025 - Sep 2027",
      description: [
        "Major in Computer Science with specialization in AI & Data Science",
        "Active participant in college technical events and competitions"
      ],
      type: "education" as const
    },
    {
      title: "Bachelor of Science (PMCS)",
      company: "Lachoo Memorial College of Science & Technology, Jodhpur",
      period: "Sep 2022 - Jul 2025",
      description: [
        "Major in Computer Science with specialization in Data Science",
        "Maintained 85.00% academic performance",
        "Active participant in college technical events and competitions"
      ],
      type: "education" as const
    },
    {
      title: "XII (Science)",
      company: "Army Public School, Jodhpur",
      period: "May 2021 - Jul 2022",
      description: [
        "Completed senior secondary education with Science stream",
        "Achieved 85.00% in final examinations",
        "Strong foundation in Mathematics and Physics"
      ],
      type: "education" as const
    }
  ];

  const projects = [
    {
      title: "ResumeParser.ai",
      description: "Natural Language Processing (NLP) application for resume optimization and analysis",
      technologies: ["Python", "NLP", "Machine Learning", "OAuth", "MongoDB"],
      features: [
        "Built a web app to extract structured data from resumes using spaCy & NLP",
        "Integrated Google OAuth and MongoDB for user data handling",
        "Enabled downloads in CSV, JSON, Excel, deployed on Railway with 12+ web integrations"
      ],
      links: { demo: "https://resumeparserai.up.railway.app/", github: "https://github.com/TAK-PRAVEEN/ResumeParser.ai" }
    },
    {
      title: "Mushroom Classification",
      description: "Machine Learning project for identifying edible vs poisonous mushrooms",
      technologies: ["Python", "Scikit-learn", "Decision Tree", "Model Evaluation"],
      features: [
        "Trained a Decision Tree classifier to identify edible vs poisonous mushrooms",
        "Achieved 99% accuracy using feature engineering and model evaluation",
        "Implemented comprehensive data preprocessing and validation techniques"
      ],
      links: { demo: "https://mushrooms-classification-w915.onrender.com/", github: "https://github.com/TAK-PRAVEEN/MUSHROOMS-CLASSIFICATION" }
    },
    {
      title: "Library Management System",
      description: "Comprehensive Python-based library management solution",
      technologies: ["Python", "Database Management", "GUI", "Tkinter", "JSON"],
      features: [
        "Created a GUI-based system for book issuing, returns, and tracking",
        "Integrated email database and real-time listing of available books",
        "Implemented user-friendly interface with comprehensive book management features"
      ],
      links: { github: "https://github.com/TAK-PRAVEEN/Library-Management" }
    }
  ];

  const certifications = [
    { name: "ChatGPT Prompt Engineering for Developers", provider: "DeepLearning.AI & ChatGPT", date: "Aug 2025" },
    { name: "Cloud Technical Series - AI Agents edition", provider: "United Latino Students Association", date: "Aug 2025" },
    { name: "Exploring AI Use Cases and Applications", provider: "Amazon Web Services (AWS)", date: "Aug 2025" },
    { name: "Excel Formulas & Functions Basic to Advanced", provider: "Unstop", date: "Jul 2025 - Jul 2025" },
    { name: "Online Photography Competition - NIRA", provider: "Unstop", date: "Jul 2025" },
    { name: "Gen AI Academy", provider: "Google Cloud & Hack2skill", date: "Jul 2025" },
    { name: "AWS Submit", provider: "Amazon Web Services (AWS)", date: "Jul 2025" },
    { name: "Tata GenAI Powered Data Analytics Job Simulation", provider: "Forage", date: "Jul 2025" },
    { name: "Global Photography Contest", provider: "iNOVIZE Art and Culture", date: "Jul 2025" },
    { name: "FinQuest", provider: "Department of Finance Studies, University of Delhi", date: "Jun 2025" },
    { name: "Microsoft Power BI", provider: "Infosys Springboard", date: "Jun 2025 - Jun 2025" },
    { name: "Central India Hackathon 2.0", provider: "Suryodaya College of Engineering & Technology, Nagpur", date: "Jun 2025" },
    { name: "Full Stack Data Science Pro", provider: "PW Skills", date: "Aug 2023 - Jan 2025" },
    { name: "Codemathon 2024", provider: "Department of Mathematics, NIT Kurukshetra", date: "Oct 2024" },
    { name: "Python Stack", provider: "Great Learning", date: "Feb 2024 - Feb 2024" },
    { name: "Python for Data Science", provider: "Udemy", date: "Oct 2023 - Oct 2023" },
    { name: "Learn Python & Machine Learning", provider: "Microsoft Learn Student Ambassador, Google Developer Student Clubs", date: "Jul 2025" },
    { name: "Cloud Technical Series", provider: "Google", date: "Mar 2023" }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hover-scale">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Experience & Projects
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              My professional journey, educational background, and project portfolio
            </p>
          </div>
        </div>
      </section>

      {/* Work Experience Timeline */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-primary" />
            Work Experience
          </h2>
          
          <div className="space-y-0">
            {workExperience.map((exp, index) => (
              <TimelineItem key={index} {...exp} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 px-6 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-primary" />
            Featured Projects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* Education Timeline */}
      <section className="py-12 px-6" id="Education">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-secondary" />
            Education
          </h2>
          
          <div className="space-y-0">
            {education.map((edu, index) => (
              <TimelineItem key={index} {...edu} />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-12 px-6 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <Award className="w-6 h-6 mr-3 text-accent" />
            Certifications & Courses
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <Card key={index} className="glass-hover p-4 bg-gradient-card hover-lift animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-semibold text-card-foreground text-sm leading-tight">
                    {cert.name}
                  </h4>
                  <p className="text-xs text-primary">{cert.provider}</p>
                  <p className="text-xs text-muted-foreground">{cert.date}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extra-curricular Activities */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">Extra-curricular Activities</h2>
          
          <div className="space-y-4">
            {[
              "Poster Making Competition Winner — National Mathematics Day",
              "Active participant in coding competitions and hackathons", 
              "Calligraphy Competition Winner — APS Session 2021-22",
              "National Reading (English) — APS Session 2021-22"
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg glass-hover hover-lift animate-fade-in"
              >
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-foreground">{activity}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              <strong>Hobbies:</strong> Watching movies, Photography, playing football, travelling, exploring user technology
            </p>
            
            <Link to="/">
              <Button size="lg" className="hover-scale shadow-glow">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Experience;