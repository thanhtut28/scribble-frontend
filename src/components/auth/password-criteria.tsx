import { Check, X } from "lucide-react";

const PasswordCriteria = ({ password }: { password: string }) => {
  // Define password criteria
  const criteria = [
    {
      label: "At least 3 characters",
      met: password.length >= 3,
    },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains a number",
      met: /[0-9]/.test(password),
    },
  ];

  // Calculate overall strength
  const metCount = criteria.filter((c) => c.met).length;
  const strength = metCount === 0 ? 0 : metCount / criteria.length;

  // Determine strength color
  const getStrengthColor = () => {
    if (strength === 0) return "bg-gray-200";
    if (strength < 0.4) return "bg-red-500";
    if (strength < 0.7) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {criterion.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-amber-400" />
            )}
            <span
              className={criterion.met ? "text-green-500" : "text-amber-700"}
            >
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordCriteria;
