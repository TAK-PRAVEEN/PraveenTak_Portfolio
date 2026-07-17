import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  align?: "center" | "left";
}

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  align = "center",
}: SectionHeaderProps) => {
  const isCenter = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`mb-8 ${isCenter ? "text-center" : "text-left"}`}
    >
      <h2
        className={`flex items-center text-3xl font-bold text-foreground md:text-4xl ${
          isCenter ? "justify-center" : ""
        }`}
      >
        {Icon && <Icon className="mr-3 h-6 w-6 text-primary" />}
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-muted-foreground ${
            isCenter ? "mx-auto max-w-2xl" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeader;
