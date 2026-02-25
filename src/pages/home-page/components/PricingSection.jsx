import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PricingSection = ({ onSubscribe }) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    "Unlimited recording sessions",
    "All professional presets (Hip-Hop, R&B, Pop, Jazz)",
    "Zero latency recording",
    "Automated mixing and mastering",
    "WAV and MP3 export",
    "Save unlimited projects",
    "Real-time autotune with adjustable speed",
    "Multi-layer recording (16 tracks)",
    "Professional EQ, reverb, and echo controls",
    "Priority customer support",
    "Regular feature updates",
    "Commercial use license"
  ];

  const trustBadges = [
    { icon: "Shield", text: "SSL Secured" },
    { icon: "Lock", text: "Encrypted" },
    { icon: "CreditCard", text: "Stripe Payments" },
    { icon: "RefreshCw", text: "Cancel Anytime" }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-background">
      <div className="container-studio">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm md:text-base font-medium mb-4">
            <Icon name="DollarSign" size={16} />
            <span>Pricing</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Start with 3 free demos. No credit card required.
          </p>

          <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 md:px-6 py-2 rounded-md text-sm md:text-base font-medium transition-studio ${
                !isAnnual
                  ? 'bg-accent text-accent-foreground shadow-studio-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 md:px-6 py-2 rounded-md text-sm md:text-base font-medium transition-studio ${
                isAnnual
                  ? 'bg-accent text-accent-foreground shadow-studio-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <span className="ml-2 text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-studio-xl border-2 border-accent overflow-hidden">
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-6 md:p-8 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full text-accent text-xs md:text-sm font-medium mb-4">
                <Icon name="Star" size={14} />
                <span>Most Popular</span>
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
                Pro Subscription
              </h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
                  ${isAnnual ? '8.99' : '10.99'}
                </span>
                <span className="text-lg md:text-xl text-muted-foreground">
                  /{isAnnual ? 'month' : 'month'}
                </span>
              </div>
              {isAnnual && (
                <p className="text-sm text-muted-foreground">
                  Billed annually at $107.88 (save $23.88)
                </p>
              )}
            </div>

            <div className="p-6 md:p-8 lg:p-10">
              <div className="mb-8">
                <h4 className="text-base md:text-lg font-heading font-bold text-foreground mb-4">
                  Everything included:
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name="Check" size={12} className="text-success" />
                      </div>
                      <span className="text-sm md:text-base text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="default"
                  size="lg"
                  fullWidth
                  iconName="CreditCard"
                  iconPosition="left"
                  onClick={onSubscribe}
                  className="shadow-studio glow-amber"
                >
                  Start Free Trial
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    3 free demo recordings • No credit card required • Cancel anytime
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    {trustBadges?.map((badge, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Icon name={badge?.icon} size={14} className="text-success" />
                        <span>{badge?.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-12 grid sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border text-center">
              <Icon name="Users" size={24} className="mx-auto mb-3 text-accent" />
              <p className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">10,000+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Active Creators</p>
            </div>
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border text-center">
              <Icon name="Music" size={24} className="mx-auto mb-3 text-primary" />
              <p className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">50,000+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Tracks Produced</p>
            </div>
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border text-center">
              <Icon name="Star" size={24} className="mx-auto mb-3 text-secondary" />
              <p className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">4.9/5</p>
              <p className="text-xs md:text-sm text-muted-foreground">User Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;