import Link from "next/link";

const Footer = () => (
  <footer className="border-t bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">P</span>
            </div>
            <span className="font-display font-bold">Paryuktam</span>
          </div>
          <p className="text-sm text-muted-foreground">Team-based student freelancing & collaboration platform.</p>
          <p className="text-xs text-muted-foreground mt-3">Acquired by NEXONVATE</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Platform</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground transition-colors">Browse Projects</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Join as Student</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Post a Project</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Resources</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <span>Documentation</span>
            <span>Support</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-3">Legal</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
        © 2026 Paryuktam by NEXONVATE. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
