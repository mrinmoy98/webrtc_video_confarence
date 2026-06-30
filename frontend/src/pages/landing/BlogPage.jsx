import { BLOG } from './data';

export default function BlogPage() {
  const [featured, ...rest] = BLOG;
  return (
    <>
      <section className="lp-page-hero">
        <span className="lp-eyebrow">Blog</span>
        <h1>News, tips & <span className="grad">guides</span></h1>
        <p>Ideas to help you run better meetings and get the most out of Video Conference.</p>
      </section>

      <section className="lp-section tight">
        <article className="lp-featured">
          <div className="lp-featured-cover"><span>{featured.tag}</span></div>
          <div className="lp-featured-body">
            <span className="lp-post-meta">{featured.tag} · {featured.date}</span>
            <h2>{featured.title}</h2>
            <p>{featured.text}</p>
            <a href="#" className="lp-btn ghost" onClick={(e) => e.preventDefault()}>Read article →</a>
          </div>
        </article>

        <div className="lp-grid-3 blog">
          {rest.map((b) => (
            <article className="lp-post" key={b.title}>
              <div className="lp-post-cover"><span>{b.tag}</span></div>
              <div className="lp-post-body">
                <span className="lp-post-meta">{b.tag} · {b.date}</span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
                <a href="#" className="lp-readmore" onClick={(e) => e.preventDefault()}>Read more →</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
