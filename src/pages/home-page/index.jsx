import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import HeroSection from './components/HeroSection';
import HowToGuide from './components/HowToGuide';
import FeatureHighlights from './components/FeatureHighlights';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import SubscriptionModal from './components/SubscriptionModal';

const HomePage = () => {
  const navigate = useNavigate();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleStartTrial = () => {
    if (isSubscribed) {
      navigate('/recording-studio');
    } else {
      navigate('/recording-studio');
    }
  };

  const handleSubscribe = () => {
    setSubscriptionModalOpen(true);
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    navigate('/recording-studio');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-[60px]">
        <HeroSection onStartTrial={handleStartTrial} />
        <HowToGuide />
        <FeatureHighlights />
        <PricingSection onSubscribe={handleSubscribe} />
        <TestimonialsSection />
        <FAQSection />
      </main>

      <Footer />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default HomePage;