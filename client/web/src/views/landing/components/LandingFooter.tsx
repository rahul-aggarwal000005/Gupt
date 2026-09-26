export function LandingFooter() {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
      <p>© {new Date().getFullYear()} Gupt. Open source software.</p>
      <p className="mt-2 md:mt-0">Built with Next.js, Express, and Prisma.</p>
    </footer>
  );
}
