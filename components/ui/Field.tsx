import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import type { IconType } from "react-icons";

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline,
  rows = 3,
  helperText,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  helperText?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2 flex justify-between">
        <span>
          {label} {required && <span className="text-primary">*</span>}
        </span>
        {icon && (
          <span className="text-muted-foreground opacity-50">{icon}</span>
        )}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y min-h-[100px]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          // The global style tag above handles the 'no-spinner' look for type="number"
          className="w-full px-4 py-3 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      )}
      {helperText && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-1 opacity-80">
          {helperText}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || value;

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-foreground mb-2 flex justify-between">
        <span>{label}</span>
        {icon && (
          <span className="text-muted-foreground opacity-50">{icon}</span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-muted/30 border rounded-xl text-foreground transition-all hover:bg-muted/50 ${
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-input"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <FiChevronDown
          className={`text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - FIXED BG COLOR */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <FiCheck size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  helperText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  helperText?: string;
}) {
  return (
    <div className="bg-muted/30 border border-input rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded">
          {value}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
      {helperText && (
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      )}
    </div>
  );
}

function CustomSelect({
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string; icon?: IconType }[];
  onChange: (val: string) => void;
  icon?: IconType;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`w-full text-left pl-10 pr-10 py-2.5 bg-muted/30 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between ${
          isOpen ? "ring-2 ring-primary/50 border-primary" : ""
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown
          className={`text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 ${
                  value === option.value
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                {option.icon && <option.icon className="opacity-70" />}
                {option.label}
                {value === option.value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export { SliderField, SelectField, InputField, CustomSelect };
