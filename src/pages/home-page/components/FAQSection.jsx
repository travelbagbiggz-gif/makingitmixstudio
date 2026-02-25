import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "You get 3 free demo recordings with full access to all features including professional presets, automated mixing, and mastering. No credit card required. Demo recordings cannot be downloaded but can be previewed in full quality. After your demos, subscribe for $19.99/month to unlock unlimited recordings and downloads."
    },
    {
      question: "What is zero latency recording?",
      answer: "Zero latency recording means you hear your voice in real-time (less than 10ms delay) while recording, just like in a professional studio. This eliminates the annoying echo or delay that makes it hard to perform naturally. Our technology ensures you can record vocals with perfect timing and natural delivery."
    },
    {
      question: "Can I use my own beats?",
      answer: "Yes! You can upload your own instrumental tracks in WAV, MP3, or AIFF format. Our AI automatically detects the BPM and key of your beat, then matches the autotune settings accordingly. This ensures your vocals are perfectly in tune with your instrumental."
    },
    {
      question: "What presets are available?",
      answer: "We offer four professional presets: Hip-Hop (with melodic autotune), R&B (smooth vocal processing), Pop (bright and polished), and Jazz (natural warmth). Each preset is optimized for its genre with appropriate EQ, compression, and effects settings. You can further customize any preset in the fine-tune mixing stage."
    },
    {
      question: "How many vocal layers can I record?",
      answer: "You can record up to 16 vocal layers per song: 4 layers (lead, double, adlib, extra) for each of 3 verses plus 4 layers for the hook section. This allows you to create professional, layered vocal arrangements with harmonies, doubles, and adlibs."
    },
    {
      question: "What export formats are supported?",
      answer: "Subscribers can export in both WAV (uncompressed, studio quality) and MP3 (compressed, web-ready) formats. You can choose from three loudness targets: Streaming (optimized for Spotify/Apple Music), Loud (radio-ready), or Club (maximum impact for DJ sets)."
    },
    {
      question: "Can I edit my mix after mastering?",
      answer: "Yes! After mastering, you can go back to the fine-tune mixing page to adjust EQ, reverb, echo, or any other settings. Once you're satisfied, simply re-master with your updated mix. All your projects are saved automatically so you can revisit and edit them anytime."
    },
    {
      question: "Do I need any special equipment?",
      answer: "All you need is a computer with a microphone and internet connection. For best results, we recommend using a USB microphone or audio interface, but even a laptop's built-in mic will work. Headphones are recommended to prevent audio feedback during recording."
    },
    {
      question: "Is my voice data private?",
      answer: "Absolutely. Your voice recordings are stored securely and encrypted. We never share, sell, or use your audio for any purpose other than providing our service to you. You retain full ownership and rights to all content you create. See our Privacy Policy for complete details."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no penalties or fees. You'll continue to have access until the end of your current billing period. All your saved projects remain accessible even after cancellation, though you won't be able to export new recordings without an active subscription."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-background">
      <div className="container-studio">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm md:text-base font-medium mb-4">
            <Icon name="HelpCircle" size={16} />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about makingitmixstudio
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs?.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border overflow-hidden transition-studio hover:border-accent/50"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-4 md:p-6 flex items-start justify-between gap-4 text-left transition-studio hover:bg-muted/50"
              >
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-heading font-bold text-foreground">
                    {faq?.question}
                  </h3>
                </div>
                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 transition-studio ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  <Icon name="ChevronDown" size={16} className="text-accent" />
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {faq?.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <div className="bg-card rounded-2xl p-6 md:p-8 lg:p-12 border border-border max-w-2xl mx-auto">
            <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-accent" />
            <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3">
              Still have questions?
            </h3>
            <p className="text-base md:text-lg text-muted-foreground mb-6">
              Our support team is here to help you get started with professional audio recording
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@makingitmixstudio.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium transition-studio hover:bg-accent/90 shadow-studio"
              >
                <Icon name="Mail" size={20} />
                <span>Email Support</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg font-medium transition-studio hover:bg-muted/80"
              >
                <Icon name="BookOpen" size={20} />
                <span>View Documentation</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;