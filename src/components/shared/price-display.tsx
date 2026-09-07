const formatBDT = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PriceDisplay({
  price,
  originalPrice,
}: {
  price: number;
  originalPrice?: number;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-bold text-[var(--color-text)]">
        {formatBDT(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className="text-sm text-[var(--color-text-muted)] line-through">
          {formatBDT(originalPrice)}
        </span>
      )}
    </div>
  );
}
