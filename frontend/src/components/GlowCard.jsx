import { motion } from 'framer-motion';

const GlowCard = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 0 30px rgba(227,30,36,0.4)" }}
      className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlowCard;