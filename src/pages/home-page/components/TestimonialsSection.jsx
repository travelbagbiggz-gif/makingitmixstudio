import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TestimonialsSection = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
  {
    id: 1,
    name: "Marcus Johnson",
    role: "Hip-Hop Artist",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a7a81d3a-1763296787687.png",
    avatarAlt: "Professional headshot of African American male hip-hop artist with short fade haircut wearing black hoodie and gold chain necklace",
    rating: 5,
    text: "This platform completely changed my workflow. I used to spend hours in expensive studios, now I record professional-quality vocals from home. The autotune preset is incredible - it matches my beat's key perfectly every time.",
    tracks: "127 tracks produced"
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "R&B Singer",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d92ac120-1763293804988.png",
    avatarAlt: "Professional headshot of Asian female R&B singer with long straight black hair wearing elegant white blouse with subtle makeup",
    rating: 5,
    text: "The zero latency recording is a game-changer. I can finally record vocals naturally without that annoying delay. The automated mixing saves me so much time, and the results sound like they came from a professional studio.",
    tracks: "89 tracks produced"
  },
  {
    id: 3,
    name: "DJ Smooth",
    role: "Producer & Mixer",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_141af1a0a-1764677716570.png",
    avatarAlt: "Professional headshot of Hispanic male music producer wearing black baseball cap and denim jacket with headphones around neck",
    rating: 5,
    text: "I\'ve been producing for 10 years and this is the most intuitive vocal recording platform I\'ve used. The multi-layer recording feature lets me create complex vocal arrangements quickly. My clients love the professional sound quality.",
    tracks: "203 tracks produced"
  },
  {
    id: 4,
    name: "Aisha Williams",
    role: "Content Creator",
    avatar: "https://images.unsplash.com/photo-1718609257243-f658c2094e8e",
    avatarAlt: "Professional headshot of African American female content creator with natural curly hair wearing bright yellow top and statement earrings",
    rating: 5,
    text: "As a content creator, I need quick turnaround times. This platform lets me record, mix, and export professional audio in under an hour. The presets are perfect for my podcast intros and music content. Absolutely worth the subscription.",
    tracks: "156 tracks produced"
  }];


  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials?.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials?.length) % testimonials?.length);
  };

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-card">
      <div className="container-studio">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm md:text-base font-medium mb-4">
            <Icon name="MessageSquare" size={16} />
            <span>Testimonials</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Trusted by Creators Worldwide
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            See what independent artists and content creators are saying about makingitmixstudio
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-2xl shadow-studio-xl p-6 md:p-8 lg:p-12 border border-border">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-accent shadow-studio">
                    <Image
                      src={testimonials?.[activeTestimonial]?.avatar}
                      alt={testimonials?.[activeTestimonial]?.avatarAlt}
                      className="w-full h-full object-cover" />
                    
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-accent rounded-full flex items-center justify-center shadow-studio">
                    <Icon name="Quote" size={20} className="text-accent-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-1 mb-3">
                  {[...Array(testimonials?.[activeTestimonial]?.rating)]?.map((_, i) =>
                  <Icon key={i} name="Star" size={16} className="text-accent fill-accent" />
                  )}
                </div>

                <p className="text-base md:text-lg lg:text-xl text-foreground leading-relaxed mb-6">
                  "{testimonials?.[activeTestimonial]?.text}"
                </p>

                <div className="space-y-2">
                  <h4 className="text-lg md:text-xl font-heading font-bold text-foreground">
                    {testimonials?.[activeTestimonial]?.name}
                  </h4>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {testimonials?.[activeTestimonial]?.role}
                  </p>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-xs md:text-sm text-muted-foreground font-mono">
                    <Icon name="Music" size={14} className="text-accent" />
                    <span>{testimonials?.[activeTestimonial]?.tracks}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center transition-studio hover:bg-accent hover:text-accent-foreground"
                aria-label="Previous testimonial">
                
                <Icon name="ChevronLeft" size={20} />
              </button>

              <div className="flex gap-2">
                {testimonials?.map((_, index) =>
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-studio ${
                  index === activeTestimonial ? 'bg-accent w-8' : 'bg-muted'}`
                  }
                  aria-label={`Go to testimonial ${index + 1}`} />

                )}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center transition-studio hover:bg-accent hover:text-accent-foreground"
                aria-label="Next testimonial">
                
                <Icon name="ChevronRight" size={20} />
              </button>
            </div>
          </div>

          <div className="mt-8 md:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
            { icon: "Mic", label: "Zero Latency", value: "< 10ms" },
            { icon: "Users", label: "Active Users", value: "10K+" },
            { icon: "Music", label: "Tracks Made", value: "50K+" },
            { icon: "Star", label: "Avg Rating", value: "4.9/5" }]?.
            map((stat, index) =>
            <div key={index} className="bg-background rounded-xl p-4 md:p-6 border border-border text-center">
                <Icon name={stat?.icon} size={24} className="mx-auto mb-2 text-accent" />
                <p className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
                  {stat?.value}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat?.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;