import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import LegalAccessModal from '../../../components/ui/LegalAccessModal';

const Footer = () => {
  const navigate = useNavigate();
  const [legalModal, setLegalModal] = useState({ isOpen: false, content: null, title: '' });

  const openLegalModal = (content, title) => {
    setLegalModal({ isOpen: true, content, title });
  };

  const closeLegalModal = () => {
    setLegalModal({ isOpen: false, content: null, title: '' });
  };

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How It Works", href: "#how-to-guide" },
      { label: "FAQ", href: "#faq" }
    ],
    legal: [
      { label: "Terms of Service", action: () => openLegalModal('terms', 'Terms of Service') },
      { label: "Privacy Policy", action: () => navigate('/privacy-policy-modal') },
      { label: "DMCA & Content Policy", action: () => navigate('/dmca-content-policy-modal') }
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "mailto:support@makingitmixstudio.com" },
      { label: "System Status", href: "#" },
      { label: "API Documentation", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: "Twitter", href: "#", label: "Twitter" },
    { icon: "Instagram", href: "#", label: "Instagram" },
    { icon: "Youtube", href: "#", label: "YouTube" },
    { icon: "Facebook", href: "#", label: "Facebook" }
  ];

  return (
    <>
      <footer className="bg-card border-t border-border">
        <div className="container-studio py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Icon name="Music" size={24} className="text-accent" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">
                  makingitmixstudio
                </span>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md">
                Professional audio recording, mixing, and mastering platform designed for independent artists and content creators.
              </p>
              <div className="flex items-center gap-3">
                {socialLinks?.map((social, index) => (
                  <a
                    key={index}
                    href={social?.href}
                    aria-label={social?.label}
                    className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-studio hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon name={social?.icon} size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks?.product?.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link?.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-studio"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks?.legal?.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={link?.action}
                      className="text-sm text-muted-foreground hover:text-accent transition-studio text-left"
                    >
                      {link?.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks?.support?.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link?.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-studio"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © {new Date()?.getFullYear()} makingitmixstudio. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={14} className="text-success" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Lock" size={14} className="text-success" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="CreditCard" size={14} className="text-success" />
                  <span>Stripe Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <LegalAccessModal
        isOpen={legalModal?.isOpen}
        onClose={closeLegalModal}
        content={legalModal?.content}
        title={legalModal?.title}
      />
    </>
  );
};

export default Footer;