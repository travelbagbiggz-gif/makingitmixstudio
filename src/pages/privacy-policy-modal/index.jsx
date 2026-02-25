import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';

const PrivacyPolicyModal = () => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    marketing: false,
    thirdParty: false
  });

  const privacySections = [
    {
      id: 'collection',
      icon: 'Database',
      heading: 'Information We Collect',
      content: 'We collect information you provide directly to us, including account information (name, email, password), audio projects and recordings, payment information (processed securely through Stripe), and usage data. We also collect technical information about your device and how you interact with our service, including IP address, browser type, operating system, device identifiers, and session data. Audio recordings are stored securely with encryption, and we never access your creative content without explicit permission.',
      details: [
        'Account credentials and profile information',
        'Audio files, projects, and session metadata',
        'Payment and billing information (via Stripe)',
        'Device information and browser data',
        'Usage analytics and interaction patterns'
      ]
    },
    {
      id: 'usage',
      icon: 'Activity',
      heading: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services; process your transactions and manage subscriptions; send you technical notices, updates, and support messages; respond to your comments, questions, and requests; analyze usage patterns to enhance user experience; detect and prevent fraud and abuse; comply with legal obligations; and personalize your experience with relevant features and content.',
      details: [
        'Service delivery and platform functionality',
        'Payment processing and subscription management',
        'Customer support and communication',
        'Platform improvements and feature development',
        'Security monitoring and fraud prevention'
      ]
    },
    {
      id: 'storage',
      icon: 'HardDrive',
      heading: 'Data Storage and Security',
      content: 'Your audio projects are stored securely on cloud servers with enterprise-grade encryption. We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL) and at rest (AES-256), regular security audits and penetration testing, access controls and authentication protocols, automated backup systems, and secure data centers with physical security. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.',
      details: [
        'End-to-end encryption for audio files',
        'Secure cloud storage with redundancy',
        'Regular security audits and monitoring',
        'Access controls and authentication',
        'Automated backup and disaster recovery'
      ]
    },
    {
      id: 'rights',
      icon: 'Shield',
      heading: 'Your Privacy Rights',
      content: 'You have the right to access, update, or delete your personal information at any time through your account settings. You can export your audio projects and session data in standard formats. You may request that we delete your account and associated data, subject to legal retention requirements. You can opt-out of marketing communications while still receiving essential service notifications. You have the right to data portability and can request a copy of your information in a structured format.',
      details: [
        'Access and download your personal data',
        'Update or correct your information',
        'Delete your account and data',
        'Opt-out of marketing communications',
        'Request data portability'
      ]
    },
    {
      id: 'thirdparty',
      icon: 'Link',
      heading: 'Third-Party Services',
      content: 'We use third-party services to provide and improve our platform. These include Stripe for payment processing (subject to Stripe\'s privacy policy), cloud storage providers for audio file hosting, analytics services to understand usage patterns, email service providers for transactional communications, and content delivery networks for performance optimization. We do not sell your personal information to third parties. Third-party services are carefully vetted and bound by data protection agreements.',
      details: [
        'Stripe for secure payment processing',
        'Cloud storage for audio files',
        'Analytics for platform improvement',
        'Email services for notifications',
        'CDN for performance optimization'
      ]
    },
    {
      id: 'cookies',
      icon: 'Cookie',
      heading: 'Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to maintain your session, remember your preferences, analyze usage patterns, and improve platform performance. Essential cookies are required for the platform to function properly. Analytics cookies help us understand how users interact with our service. You can control cookie preferences through your browser settings, though disabling certain cookies may limit functionality.',
      details: [
        'Essential cookies for authentication',
        'Preference cookies for settings',
        'Analytics cookies for usage insights',
        'Performance cookies for optimization',
        'Browser-based cookie controls available'
      ]
    },
    {
      id: 'retention',
      icon: 'Clock',
      heading: 'Data Retention',
      content: 'We retain your personal information for as long as your account is active or as needed to provide services. Audio projects are retained until you delete them or close your account. Account information is retained for 90 days after account closure for recovery purposes. Payment records are retained for 7 years to comply with financial regulations. Usage logs are retained for 12 months for security and analytics purposes. You can request immediate deletion of your data, subject to legal requirements.',
      details: [
        'Active account data retained indefinitely',
        '90-day grace period after account closure',
        '7-year retention for payment records',
        '12-month retention for usage logs',
        'Immediate deletion available on request'
      ]
    },
    {
      id: 'compliance',
      icon: 'FileCheck',
      heading: 'Legal Compliance',
      content: 'We comply with GDPR (General Data Protection Regulation) for EU users, CCPA (California Consumer Privacy Act) for California residents, and other applicable privacy laws. We respond to data subject requests within required timeframes. We maintain records of processing activities and conduct privacy impact assessments. We report data breaches to authorities and affected users as required by law. Our privacy practices are regularly reviewed and updated to maintain compliance.',
      details: [
        'GDPR compliance for EU users',
        'CCPA compliance for California residents',
        'Timely response to data requests',
        'Privacy impact assessments',
        'Breach notification procedures'
      ]
    }
  ];

  const privacyControls = [
    {
      id: 'analytics',
      label: 'Analytics & Performance',
      description: 'Help us improve the platform by sharing usage data',
      icon: 'BarChart'
    },
    {
      id: 'marketing',
      label: 'Marketing Communications',
      description: 'Receive updates about new features and promotions',
      icon: 'Mail'
    },
    {
      id: 'thirdParty',
      label: 'Third-Party Integrations',
      description: 'Allow enhanced features through partner services',
      icon: 'Puzzle'
    }
  ];

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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev?.[sectionId]
    }));
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev?.[setting]
    }));
  };

  const handleDownloadPolicy = () => {
    const policyText = privacySections?.map(section => 
      `${section?.heading}\n\n${section?.content}\n\n`
    )?.join('');
    
    const blob = new Blob([policyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'makingitmixstudio-privacy-policy.txt';
    link?.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-background flex items-start justify-center pt-[4vh] px-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl bg-card rounded-2xl shadow-studio-xl border border-border mb-8"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border p-6 lg:p-8 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon name="Shield" size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                    Privacy Policy
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: February 25, 2026
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-studio flex-shrink-0"
              aria-label="Close"
            >
              <Icon name="X" size={24} />
            </button>
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="p-6 lg:p-8 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="Settings" size={20} className="text-accent" />
            <h3 className="text-lg font-heading font-bold text-foreground">
              Privacy Preferences
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {privacyControls?.map((control) => (
              <div
                key={control?.id}
                className="bg-card rounded-lg p-4 border border-border"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name={control?.icon} size={18} className="text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      {control?.label}
                    </span>
                  </div>
                  <Checkbox
                    checked={privacySettings?.[control?.id]}
                    onCheckedChange={() => handlePrivacyToggle(control?.id)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {control?.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            {privacySections?.map((section) => (
              <div
                key={section?.id}
                className="bg-muted/50 rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section?.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 hover:bg-muted/70 transition-studio text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={section?.icon} size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-heading font-bold text-foreground">
                        {section?.heading}
                      </h3>
                    </div>
                  </div>
                  <Icon
                    name={expandedSections?.[section?.id] ? 'ChevronUp' : 'ChevronDown'}
                    size={20}
                    className="text-muted-foreground flex-shrink-0"
                  />
                </button>

                {expandedSections?.[section?.id] && (
                  <div className="px-5 pb-5 pt-2 border-t border-border">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                      {section?.content}
                    </p>
                    {section?.details && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Key Points:
                        </p>
                        {section?.details?.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Icon
                              name="Check"
                              size={16}
                              className="text-success flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm text-muted-foreground">
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 lg:p-8 border-t border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="default"
              size="md"
              iconName="Download"
              iconPosition="left"
              onClick={handleDownloadPolicy}
              className="w-full sm:w-auto"
            >
              Download Policy
            </Button>
            <Button
              variant="outline"
              size="md"
              iconName="Settings"
              iconPosition="left"
              onClick={() => navigate('/account-management')}
              className="w-full sm:w-auto"
            >
              Manage Account Privacy
            </Button>
            <Button
              variant="outline"
              size="md"
              iconName="Mail"
              iconPosition="left"
              onClick={() => window.location.href = 'mailto:privacy@makingitmixstudio.com'}
              className="w-full sm:w-auto"
            >
              Contact Privacy Team
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-mono">ESC to close</span>
              <span className="hidden sm:inline">•</span>
              <span>Effective: February 25, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Shield" size={14} className="text-success" />
              <span>GDPR & CCPA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;