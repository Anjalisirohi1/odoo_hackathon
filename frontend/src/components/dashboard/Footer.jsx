const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Security', href: '#' },
  { label: 'Status', href: '#' },
]

export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-8 py-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex-row">
      <p>
        <span className="font-semibold text-slate-800 dark:text-slate-200">AssetFlow</span>
        <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
        &copy; {new Date().getFullYear()} AssetFlow Enterprise Asset Management. All rights reserved.
      </p>
      <div className="flex items-center gap-6">
        {footerLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}
