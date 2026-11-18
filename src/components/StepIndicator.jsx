export default function StepIndicator({ currentStep }) {
  return (
    <div
      className="grid h-0.5 w-full grid-cols-2 overflow-hidden rounded-full bg-[#dddddd]"
      role="progressbar"
      aria-label="Trainee registration progress"
      aria-valuemin={1}
      aria-valuemax={2}
      aria-valuenow={currentStep}
    >
      <span className="bg-[#ff5b21]" />
      <span className={currentStep === 2 ? "bg-[#ff5b21]" : "bg-transparent"} />
    </div>
  );
}
