import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronDown, MessageCircleQuestion } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [step, setStep] = useState<'form' | 'faq'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message || !name || !email) return;
    
    setIsSending(true);
    
    try {
      // Save chat message to Firebase
      await addDoc(collection(db, 'chat_messages'), {
        name,
        email,
        message,
        createdAt: serverTimestamp()
      });
      
      setIsSent(true);
      setMessage('');
      setName('');
      setEmail('');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setIsSent(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "You can book an appointment through our website's appointment page, by calling our helpline, or by visiting the hospital reception."
    },
    {
      question: "What insurance do you accept?",
      answer: "We accept all major insurance providers. Please contact our billing department for specific information about your insurance plan."
    },
    {
      question: "How can I get my medical records?",
      answer: "You can request your medical records through your patient portal or by submitting a request in person at our medical records department."
    }
  ];

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-40 hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>
      
      {/* Chat box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-24 right-6 w-[350px] bg-background rounded-xl shadow-2xl z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white flex items-center justify-between">
              <h3 className="font-semibold">How can we help?</h3>
              <div className="flex space-x-2">
                <button
                  className={`p-1 rounded ${step === 'form' ? 'bg-white/20' : ''}`}
                  onClick={() => setStep('form')}
                  aria-label="Contact form"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  className={`p-1 rounded ${step === 'faq' ? 'bg-white/20' : ''}`}
                  onClick={() => setStep('faq')}
                  aria-label="Frequently asked questions"
                >
                  <MessageCircleQuestion className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {step === 'form' ? (
                <>
                  {isSent ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Message Received!</h4>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll get back to you shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          type="email"
                          placeholder="Your Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="How can we help you?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus-visible:outline-none focus-visible:border-primary transition-colors resize-none h-24"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full"
                        disabled={isSending}
                      >
                        {isSending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Frequently Asked Questions</h4>
                  
                  {faqs.map((faq, index) => (
                    <div 
                      key={index}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <details className="group">
                        <summary className="flex justify-between items-center p-4 cursor-pointer">
                          <span className="font-medium text-foreground">{faq.question}</span>
                          <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="p-4 pt-0 border-t border-border">
                          <p className="text-muted-foreground text-sm">{faq.answer}</p>
                        </div>
                      </details>
                    </div>
                  ))}
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Still have questions? Contact us directly using the form.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => setStep('form')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
