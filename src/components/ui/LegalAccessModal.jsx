import React, { useEffect, useRef } from 'react';
import Icon from '../AppIcon';

const LegalAccessModal = ({ isOpen, onClose, content, title }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (modalRef?.current) {
        modalRef?.current?.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  const legalContent = {
    terms: {
      title: 'Terms of Service',
      sections: [
        {
          heading: 'Acceptance of Terms',
          content: 'By accessing and using makingitmixstudio, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.',
        },
        {
          heading: 'Use License',
          content: 'Permission is granted to temporarily use makingitmixstudio for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse engineer any software contained on the platform.',
        },
        {
          heading: 'User Content',
          content: 'You retain all rights to audio content you create using our platform. By uploading content, you grant us a license to store, process, and deliver your content as necessary to provide our services. We do not claim ownership of your creative work.',
        },
        {
          heading: 'Service Modifications',
          content: 'We reserve the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.',
        },
      ],
    },
    dmca: {
      title: 'DMCA Policy',
      sections: [
        {
          heading: 'Copyright Infringement Notification',
          content: 'If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our copyright agent with written notice containing: identification of the copyrighted work claimed to have been infringed; identification of the material that is claimed to be infringing; your contact information; a statement that you have a good faith belief that use of the material is not authorized; and a statement that the information in the notification is accurate.',
        },
        {
          heading: 'Counter-Notification',
          content: 'If you believe that your content was removed by mistake or misidentification, you may file a counter-notification with our copyright agent. The counter-notification must include: your physical or electronic signature; identification of the content that has been removed; a statement under penalty of perjury that you have a good faith belief that the content was removed as a result of mistake or misidentification.',
        },
        {
          heading: 'Repeat Infringer Policy',
          content: 'In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, in appropriate circumstances, users who are deemed to be repeat infringers. We may also limit access to the service and terminate the accounts of any users who infringe any intellectual property rights of others.',
        },
      ],
    },
    contentPolicy: {
      title: 'Content Policy',
      sections: [
        {
          heading: 'Acceptable Use',
          content: 'You may use makingitmixstudio to create, record, mix, and master original audio content. You are responsible for ensuring you have the necessary rights and permissions for any samples, loops, or third-party content you incorporate into your projects.',
        },
        {
          heading: 'Prohibited Content',
          content: 'You may not upload, create, or share content that: infringes on intellectual property rights; contains hate speech or promotes violence; includes illegal content or promotes illegal activities; violates privacy rights of others; contains malware or malicious code.',
        },
        {
          heading: 'Content Moderation',
          content: 'We reserve the right to review and remove content that violates our policies. We may also suspend or terminate accounts that repeatedly violate our content guidelines. Content removal decisions will be made in accordance with applicable laws and our internal policies.',
        },
        {
          heading: 'User Responsibility',
          content: 'You are solely responsible for the content you create and share using our platform. We do not pre-screen content but may review content in response to user reports or as part of our regular monitoring activities.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      sections: [
        {
          heading: 'Information We Collect',
          content: 'We collect information you provide directly to us, including account information, audio projects, and usage data. We also collect technical information about your device and how you interact with our service, including IP address, browser type, and operating system.',
        },
        {
          heading: 'How We Use Your Information',
          content: 'We use the information we collect to: provide, maintain, and improve our services; process your transactions; send you technical notices and support messages; respond to your comments and questions; analyze usage patterns to enhance user experience.',
        },
        {
          heading: 'Data Storage and Security',
          content: 'Your audio projects are stored securely on our servers. We implement industry-standard security measures to protect your data, including encryption in transit and at rest. However, no method of transmission over the Internet is 100% secure.',
        },
        {
          heading: 'Your Rights',
          content: 'You have the right to access, update, or delete your personal information. You can export your audio projects at any time. You may also request that we delete your account and associated data, subject to legal retention requirements.',
        },
        {
          heading: 'Third-Party Services',
          content: 'We may use third-party services for analytics, payment processing, and cloud storage. These services have their own privacy policies governing the use of your information. We do not sell your personal information to third parties.',
        },
      ],
    },
  };

  if (!isOpen) return null;

  const currentContent = content ? legalContent?.[content] : null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-background flex items-start justify-center pt-[8vh] px-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-card rounded-xl shadow-studio-xl mb-8"
        tabIndex={-1}
      >
        <div className="sticky top-0 bg-card border-b border-border p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-heading">
              {title || currentContent?.title || 'Legal Information'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-studio"
              aria-label="Close"
            >
              <Icon name="X" size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {currentContent ? (
            <div className="space-y-8">
              {currentContent?.sections?.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-h5 font-heading text-foreground">
                    {section?.heading}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {section?.content}
                  </p>
                </div>
              ))}

              <div className="mt-12 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground font-mono">
                  Last updated: February 24, 2026
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No content available</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-muted/50 border-t border-border p-4 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>ESC to close</span>
            <span>© 2026 makingitmixstudio</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAccessModal;