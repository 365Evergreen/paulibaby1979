import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="newsletter">
        <div className="newsletter__success">
          ✅ Thanks for subscribing! Check your inbox to confirm.
        </div>
      </div>
    );
  }

  return (
    <div className="newsletter">
      <div className="newsletter__content">
        <h3 className="newsletter__title">Stay in the loop</h3>
        <p className="newsletter__subtitle">
          Get notified when I publish new posts. No spam, unsubscribe anytime.
        </p>
        <form className="newsletter__form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="newsletter__input"
            required
          />
          <button type="submit" className="newsletter__button">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
