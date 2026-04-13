// Button component

// components/Button.jsx
export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  // 1. Define your base classes
  const baseClasses = "px-6 py-2 rounded-lg font-bold transition-all";

  // 2. Define variants
  const variantClasses = {
    primary: "bg-[#7a1f2e] text-white hover:bg-[#c22942]",
    outline:
      "bg-[#f3efe5] border-2 border-[#d9d4cb] text-[#99907e] hover:border-[#524938] hover:text-[#524938]",
  };

  return (
    // 3. Combine them all together!
    // baseClasses + chosen variant + any extra className passed from the parent
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
