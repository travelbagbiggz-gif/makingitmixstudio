import React from 'react';
import Icon from '../../../components/AppIcon';

const FeatureHighlights = () => {
  const features = [
    {
      icon: "Zap",
      title: "Zero Latency Recording",
      description: "Experience real-time monitoring with less than 10ms latency. Record vocals naturally without any delay or timing issues.",
      color: "accent"
    },
    {
      icon: "Music",
      title: "Professional Presets",
      description: "Choose from Hip-Hop, R&B, Pop, and Jazz presets with automatic key and BPM matching for perfect vocal processing.",
      color: "primary"
    },
    {
      icon: "Layers",
      title: "Multi-Layer Recording",
      description: "Record lead vocals, doubles, adlibs, and extras across three verses and hooks. Up to 16 vocal layers per song.",
      color: "secondary"
    },
    {
      icon: "Sliders",
      title: "Automated Mixing",
      description: "AI-powered mixing automatically balances your vocals and beat. Fine-tune with professional EQ, reverb, and echo controls.",
      color: "accent"
    },
    {
      icon: "Sparkles",
      title: "Real-Time Autotune",
      description: "Apply pitch correction in real-time with adjustable retune speed from 0-100. Toggle on/off during recording.",
      color: "primary"
    },
    {
      icon: "Download",
      title: "Professional Export",
      description: "Export studio-quality audio in WAV or MP3 format. Choose loudness targets for streaming, club, or loud playback.",
      color: "secondary"
    }
  ];

  const colorClasses = {
    accent: "bg-accent/10 text-accent",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary"
  };

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-card">
      <div className="container-studio">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm md:text-base font-medium mb-4">
            <Icon name="Star" size={16} />
            <span>Features</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Everything You Need for Professional Audio
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Studio-grade tools designed for independent artists and content creators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features?.map((feature, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-6 md:p-8 border border-border hover:border-accent/50 transition-studio group"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${colorClasses?.[feature?.color]} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-studio`}>
                <Icon name={feature?.icon} size={24} />
              </div>
              <h3 className="text-lg md:text-xl font-heading font-bold text-foreground mb-3">
                {feature?.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {feature?.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl p-6 md:p-8 lg:p-12 border border-accent/20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-4">
                Professional Quality, Simplified Workflow
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6">
                Our platform combines the power of professional DAW software with an intuitive interface designed for creators of all skill levels.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">No technical audio knowledge required</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">Professional results in minutes, not hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground">Save and revisit projects anytime</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-xl p-4 md:p-6 border border-border">
                <div className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-accent mb-2">
                  &lt;10ms
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">Recording Latency</p>
              </div>
              <div className="bg-background rounded-xl p-4 md:p-6 border border-border">
                <div className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-primary mb-2">
                  48kHz
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">Sample Rate</p>
              </div>
              <div className="bg-background rounded-xl p-4 md:p-6 border border-border">
                <div className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-secondary mb-2">
                  16
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">Vocal Layers</p>
              </div>
              <div className="bg-background rounded-xl p-4 md:p-6 border border-border">
                <div className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-accent mb-2">
                  4
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">Genre Presets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;