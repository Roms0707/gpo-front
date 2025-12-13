import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

interface LoginButtonProps {
  label: string;
  className?: string;
  variant?: 'default' | 'transparent' | 'outline';
}

const LoginButton: React.FC<LoginButtonProps> = ({
  label,
  className = '',
  variant = 'default',
}) => {
  const baseStyles = `
    relative inline-flex items-center gap-2 px-5 py-2.5
    font-semibold text-sm rounded-full
    transition-all duration-300 ease-out
    overflow-hidden group
  `;

  const variants = {
    default: `
      bg-gradient-to-r from-primary-500 to-primary-600
      text-white shadow-lg shadow-primary-500/25
      hover:shadow-xl hover:shadow-primary-500/40
      hover:scale-105 active:scale-100
    `,
    transparent: `
      bg-white/10 backdrop-blur-sm border border-white/20
      text-white
      hover:bg-white/20 hover:border-white/30
      hover:scale-105 active:scale-100
    `,
    outline: `
      bg-transparent border-2 border-primary-500
      text-primary-500 dark:text-primary-400
      hover:bg-primary-500 hover:text-white
      hover:scale-105 active:scale-100
    `,
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to="/login"
        className={`${baseStyles} ${variants[variant]} ${className}`}
        aria-label="Log in to your account"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <LogIn className="w-4 h-4" />
        <span className="relative">{label}</span>
      </Link>
    </motion.div>
  );
};

export default LoginButton;
