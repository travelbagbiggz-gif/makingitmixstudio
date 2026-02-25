import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';


const DmcaContentPolicyModal = () => {
  const navigate = useNavigate();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape') {
        navigate(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    if (modalRef?.current) {
      modalRef?.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [navigate]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      navigate(-1);
    }
  };

  const policyContent = [
    {
      icon: 'Music',
      title: 'Beat Licensing Requirements',
      sections: [
        {
          heading: 'Commercial vs. Non-Commercial Use',
          content: 'All beats imported into makingitmixstudio must have proper licensing for your intended use. Commercial releases (streaming platforms, sales, monetized content) require commercial licenses. Non-commercial use (personal demos, practice) may use lease licenses. Always verify licensing terms before distribution.'
        },
        {
          heading: 'License Verification',
          content: 'Keep copies of all beat licenses and receipts. When uploading beats, ensure you have documentation proving ownership or licensing rights. Producers may request verification at any time. Unlicensed beat usage may result in account suspension and legal action.'
        },
        {
          heading: 'Attribution Requirements',
          content: 'Most beat licenses require producer credit (e.g., "Produced by [Producer Name]"). Include credits in: song metadata, streaming platform descriptions, video descriptions, and physical releases. Failure to provide proper attribution may violate licensing agreements.'
        }
      ]
    },
    {
      icon: 'Shield',
      title: 'Copyright Infringement & DMCA',
      sections: [
        {
          heading: 'Filing a DMCA Takedown Notice',
          content: 'If you believe your copyrighted work (beat, sample, or recording) has been used without authorization, submit a DMCA notice to support@makingitmixstudio.com including: (1) Identification of copyrighted work, (2) URL/location of infringing material, (3) Your contact information, (4) Good faith statement, (5) Statement of accuracy under penalty of perjury, (6) Physical or electronic signature.'
        },
        {
          heading: 'Counter-Notification Process',
          content: 'If your content was removed due to a DMCA claim and you believe it was a mistake or misidentification, you may file a counter-notification including: (1) Your contact information, (2) Identification of removed content, (3) Statement under penalty of perjury that removal was erroneous, (4) Consent to jurisdiction, (5) Physical or electronic signature. Content may be restored after 10-14 business days unless the claimant files legal action.'
        },
        {
          heading: 'Repeat Infringer Policy',
          content: 'Users who receive three (3) verified copyright strikes will have their accounts permanently terminated. Strikes remain on your account for 12 months. We reserve the right to immediately terminate accounts involved in egregious or willful infringement.'
        }
      ]
    },
    {
      icon: 'FileText',
      title: 'User-Generated Content Guidelines',
      sections: [
        {
          heading: 'Content Ownership',
          content: 'You retain full ownership of original vocal recordings and compositions created using makingitmixstudio. However, you must have proper rights to all underlying beats, samples, and third-party content. We do not claim ownership of your creative work but require a license to store and process your content.'
        },
        {
          heading: 'Prohibited Content',
          content: 'You may not upload or create content that: (1) Infringes intellectual property rights, (2) Contains unauthorized samples or beats, (3) Includes hate speech or promotes violence, (4) Violates privacy rights, (5) Contains malware or malicious code, (6) Promotes illegal activities. Violations result in content removal and potential account termination.'
        },
        {
          heading: 'Sample Clearance',
          content: 'If your recording contains samples from other copyrighted works (vocals, instruments, sound effects), you are responsible for obtaining sample clearance. Uncleared samples can result in legal liability. Use royalty-free sample packs or obtain written permission from copyright holders.'
        },
        {
          heading: 'Beat Marketplace Compliance',
          content: 'When importing beats from third-party marketplaces (BeatStars, Airbit, etc.), ensure you: (1) Purchase appropriate license tier, (2) Download beat from legitimate source, (3) Do not share or redistribute beat files, (4) Comply with usage restrictions (streaming caps, distribution limits). We may verify licensing with producers.'
        }
      ]
    },
    {
      icon: 'AlertCircle',
      title: 'Fair Use & Transformative Works',
      sections: [
        {
          heading: 'Fair Use Guidelines',
          content: 'Fair use is a legal doctrine that permits limited use of copyrighted material without permission for purposes such as criticism, commentary, parody, or education. However, fair use is determined on a case-by-case basis and does not automatically protect all uses. Consult legal counsel if relying on fair use.'
        },
        {
          heading: 'Parody & Satire',
          content: 'Parody (commentary on the original work) may qualify for fair use protection. Satire (using a work to comment on something else) typically does not. Parody must transform the original work and not serve as a market substitute. When in doubt, obtain permission or use original beats.'
        },
        {
          heading: 'Educational & Non-Profit Use',
          content: 'Educational use does not automatically qualify as fair use, especially if the use is commercial or harms the market for the original work. Non-profit status alone does not exempt you from copyright law. Always consider the four fair use factors: purpose, nature, amount, and market effect.'
        }
      ]
    },
    {
      icon: 'Users',
      title: 'User Responsibilities',
      sections: [
        {
          heading: 'Due Diligence',
          content: 'Before uploading any beat or sample, verify you have legal rights to use it. Check licensing agreements, purchase receipts, and usage restrictions. If you cannot prove ownership or licensing, do not upload the content. Ignorance of copyright law is not a valid defense.'
        },
        {
          heading: 'Reporting Violations',
          content: 'If you discover content that violates copyright or our policies, report it immediately to support@makingitmixstudio.com. Include: (1) URL/location of content, (2) Description of violation, (3) Supporting evidence (license agreements, proof of ownership). We investigate all reports within 48 hours.'
        },
        {
          heading: 'Account Security',
          content: 'You are responsible for all activity on your account. Do not share login credentials. If your account is compromised and used for copyright infringement, you may still be held liable. Enable two-factor authentication and use strong passwords.'
        }
      ]
    },
    {
      icon: 'Mail',
      title: 'Contact & Legal Information',
      sections: [
        {
          heading: 'Copyright Agent',
          content: 'All DMCA notices and copyright-related inquiries should be sent to: Email: dmca@makingitmixstudio.com | Mail: makingitmixstudio DMCA Agent, [Address to be provided] | Response time: 48-72 hours for urgent matters'
        },
        {
          heading: 'Licensing Support',
          content: 'For questions about beat licensing, sample clearance, or usage rights, contact: licensing@makingitmixstudio.com. Our team can help you understand licensing requirements and connect you with legal resources.'
        },
        {
          heading: 'Dispute Resolution',
          content: 'Copyright disputes should first be resolved directly between parties when possible. If you receive a DMCA notice, contact the claimant to resolve the issue. If resolution is not possible, follow the counter-notification process or seek legal counsel.'
        }
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[200] bg-background flex items-start justify-center pt-[8vh] px-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl bg-card rounded-xl shadow-studio-xl mb-8"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center">
                <Icon name="Scale" size={24} className="text-accent" />
              </div>
              <div>
                <h1 className="text-h3 font-heading text-foreground">
                  DMCA & Content Policy
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Copyright guidelines for beat usage and content protection
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-studio"
              aria-label="Close"
            >
              <Icon name="X" size={24} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-mono">
            <Icon name="Calendar" size={14} />
            <span>Last updated: February 25, 2026</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          <div className="space-y-12">
            {policyContent?.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Icon name={section?.icon} size={20} className="text-accent" />
                  </div>
                  <h2 className="text-h4 font-heading text-foreground">
                    {section?.title}
                  </h2>
                </div>
                <div className="space-y-6 pl-0 lg:pl-13">
                  {section?.sections?.map((subsection, subIndex) => (
                    <div key={subIndex} className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {subsection?.heading}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {subsection?.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-h5 font-heading text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="mailto:dmca@makingitmixstudio.com"
                className="p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-studio group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="AlertTriangle" size={20} className="text-error group-hover:text-accent transition-studio" />
                  <span className="font-medium text-sm">Report Copyright Violation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  File a DMCA takedown notice
                </p>
              </a>
              <a
                href="mailto:licensing@makingitmixstudio.com"
                className="p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-studio group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="HelpCircle" size={20} className="text-warning group-hover:text-accent transition-studio" />
                  <span className="font-medium text-sm">Licensing Support</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get help with beat licensing
                </p>
              </a>
              <button
                onClick={() => window.print()}
                className="p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-studio group text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="Download" size={20} className="text-accent group-hover:text-accent transition-studio" />
                  <span className="font-medium text-sm">Download Policy</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save a copy for your records
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-muted/50 border-t border-border p-4 rounded-b-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span>Press ESC to close</span>
            <div className="flex items-center gap-4">
              <span>© 2026 makingitmixstudio</span>
              <span className="hidden md:inline">•</span>
              <a href="mailto:support@makingitmixstudio.com" className="hover:text-accent transition-studio">
                support@makingitmixstudio.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DmcaContentPolicyModal;