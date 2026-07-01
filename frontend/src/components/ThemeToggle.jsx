import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from './Icons';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      <span className="theme-toggle-ic" key={theme}>{theme === 'dark' ? <Sun /> : <Moon />}</span>
    </button>
  );
}
