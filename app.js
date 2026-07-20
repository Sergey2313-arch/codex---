const yearElement = document.querySelector('#year');
const revealElements = document.querySelectorAll('.reveal');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px',
    },
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}
