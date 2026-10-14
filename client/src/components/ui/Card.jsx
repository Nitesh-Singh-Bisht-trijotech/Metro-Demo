const TONES = {
  white: "bg-white shadow-card",
  sky: "bg-dmrc-sky shadow-card",
  blush: "bg-dmrc-blush border border-pink-200",
  mint: "bg-dmrc-mint border border-green-300",
  cream: "bg-dmrc-cream border border-dmrc-gold",
};

export default function Card({ tone = "white", className = "", children, ...props }) {
  return (
    <section className={`rounded-md ${TONES[tone]} ${className}`} {...props}>
      {children}
    </section>
  );
}
