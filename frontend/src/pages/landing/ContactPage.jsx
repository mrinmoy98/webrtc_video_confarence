import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <section className="lp-page-hero">
        <span className="lp-eyebrow">Contact us</span>
        <h1>We’d love to <span className="grad">hear from you</span></h1>
        <p>Questions, feedback or partnership ideas? Send us a message and we’ll get back to you.</p>
      </section>

      <section className="lp-section tight">
        <div className="lp-contact">
          <div className="lp-contact-info">
            <h2>Get in touch</h2>
            <p>Our team typically replies within one business day.</p>
            <ul className="lp-contact-list">
              <li><span className="lp-contact-ic">📧</span> support@videoconference.com</li>
              <li><span className="lp-contact-ic">📞</span> +91 00000 00000</li>
              <li><span className="lp-contact-ic">📍</span> Remote-first, worldwide</li>
              <li><span className="lp-contact-ic">🕐</span> Mon–Fri, 9am–6pm IST</li>
            </ul>
          </div>

          <form className="lp-contact-form" onSubmit={onSubmit}>
            {sent ? (
              <div className="lp-sent">
                <span className="lp-sent-ic">✅</span>
                <h3>Message sent!</h3>
                <p>Thanks for reaching out — we’ll be in touch soon.</p>
              </div>
            ) : (
              <>
                <label className="lp-field"><span>Name</span>
                  <input required placeholder="Your name" />
                </label>
                <label className="lp-field"><span>Email</span>
                  <input required type="email" placeholder="you@example.com" />
                </label>
                <label className="lp-field"><span>Message</span>
                  <textarea required rows={5} placeholder="How can we help?" />
                </label>
                <button className="lp-btn solid" type="submit">Send message</button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
