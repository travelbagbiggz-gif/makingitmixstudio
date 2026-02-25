import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';

const TermsOfServiceModal = () => {
  const sections = [
    {
      heading: 'Acceptance of Terms',
      content: 'By accessing and using makingitmixstudio, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.'
    },
    {
      heading: 'Subscription and Billing',
      content: 'Our Pro subscription is billed at $10.99 per month. You will be charged automatically each billing cycle unless you cancel your subscription. Free users receive 3 demo recordings with no credit card required. All payments are processed securely through Stripe.'
    },
    {
      heading: 'Use License',
      content: 'Permission is granted to use makingitmixstudio for personal and commercial purposes. This is the grant of a license, not a transfer of title. You may not: modify or copy the software; attempt to decompile or reverse engineer any software; remove any copyright or proprietary notations; transfer the software to another person without authorization.'
    },
    {
      heading: 'User Content and Ownership',
      content: 'You retain all rights to audio content you create using our platform. By uploading content, you grant us a license to store, process, and deliver your content as necessary to provide our services. We do not claim ownership of your creative work. You are responsible for ensuring you have rights to any beats, samples, or third-party content you use.'
    },
    {
      heading: 'Prohibited Uses',
      content: 'You may not use our service to: upload copyrighted material without permission; create or distribute illegal content; harass or harm others; attempt to gain unauthorized access to our systems; use automated systems to access the service; resell or redistribute our service without authorization.'
    },
    {
      heading: 'Service Modifications',
      content: 'We reserve the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service. We may update features, pricing, or terms with reasonable notice to users.'
    },
    {
      heading: 'Cancellation and Refunds',
      content: 'You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period. We do not offer refunds for partial months. Free demo recordings do not expire and can be used at any time.'
    },
    {
      heading: 'Limitation of Liability',
      content: 'makingitmixstudio is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the service, including but not limited to: loss of data, loss of profits, service interruptions, or technical issues. Our total liability shall not exceed the amount you paid in the last 12 months.'
    },
    {
      heading: 'Governing Law',
      content: 'These terms shall be governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - makingitmixstudio</title>
      </Helmet>
      <Header />

      <main className="pt-[80px] pb-12">
        <div className="container-studio max-w-4xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4">
              <Icon name="FileText" size={16} />
              <span>Legal</span>
            </div>
            <h1 className="text-h1 font-heading mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: February 25, 2026
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-8">
            {sections?.map((section, index) => (
              <div key={index} className="space-y-3">
                <h2 className="text-h4 font-heading text-foreground">
                  {index + 1}. {section?.heading}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section?.content}
                </p>
              </div>
            ))}

            <div className="pt-6 border-t border-border">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/30">
                <Icon name="Info" size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium mb-1">Questions?</h3>
                  <p className="text-xs text-muted-foreground">
                    If you have any questions about these Terms of Service, please contact us at legal@makingitmixstudio.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServiceModal;