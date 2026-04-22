import Link from "next/link";
import GlobalReportButton from "./GlobalReportButton";

const Footer = () => (
  <footer className="border-t bg-card py-12">
    <div className="container mx-auto px-4 text-black">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display font-bold text-2xl text-black">Paryuktam</span>
          </div>
          <p className="text-lg text-black">Team-based student freelancing & collaboration platform.</p>
          <p className="text-base text-black mt-3">Acquired by NEXONVATE</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-xl text-black mb-4">Platform</h4>
          <div className="flex flex-col gap-3 text-lg text-black">
            <Link href="/projects" className="hover:text-gray-700 transition-colors">Browse Projects</Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">Join as Student</Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">Post a Project</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-xl text-black mb-4">Resources</h4>
          <div className="flex flex-col gap-3 text-lg text-black">
            <Link href="/how-it-works" className="hover:text-gray-700 transition-colors">How it Works</Link>
            <span className="cursor-pointer hover:text-gray-700">Documentation</span>
            <span className="cursor-pointer hover:text-gray-700">Support</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-xl text-black mb-4">Legal</h4>
          <div className="flex flex-col gap-3 text-lg text-black">
            <span className="cursor-pointer hover:text-gray-700">Privacy Policy</span>
            <span className="cursor-pointer hover:text-gray-700">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col md:flex-row justify-between items-center border-t border-gray-300 pt-8">
        <div className="text-base text-black font-medium mb-4 md:mb-0">
          © 2026 Paryuktam by NEXONVATE. All rights reserved.
        </div>
        <GlobalReportButton />
      </div>
    </div>
  </footer>
);

export default Footer;
