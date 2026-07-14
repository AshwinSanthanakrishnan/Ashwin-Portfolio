'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
}

export default function Home() {
  // Navigation & UI state
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Contact Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSending, setFormSending] = useState(false);

  // Chatbot state
  // 'minimized' triggers the floating bubble; 'normal' is default centered; 'maximized' is full console; 'floating' overlays anywhere
  const [chatState, setChatState] = useState<'normal' | 'minimized' | 'maximized' | 'floating'>('normal');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      text: "__WELCOME_CARD__",
      sender: 'bot'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Typewriter Hero title state
  const [typedText, setTypedText] = useState('Data Professional');
  const roles = [
    'AI Engineer',
    'AI Data Analyst',
    'Power Platform Developer',
    'Data Engineer'
  ];

  // Typing effect hook
  useEffect(() => {
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timer: NodeJS.Timeout;

    function typeLoop() {
      const currentRole = roles[roleIndex];

      if (isDeleting) {
        setTypedText(currentRole.substring(0, charIndex - 1));
        charIndex--;
        typingSpeed = 50;
      } else {
        setTypedText(currentRole.substring(0, charIndex + 1));
        charIndex++;
        typingSpeed = 100;
      }

      if (!isDeleting && charIndex === currentRole.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typingSpeed = 500;
      }

      timer = setTimeout(typeLoop, typingSpeed);
    }

    timer = setTimeout(typeLoop, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Header scroll detection & scroll spy
  useEffect(() => {
    const handleScroll = () => {
      // Header solid color transition
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Sticky chat bar visibility
      if (window.scrollY > 600) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
        setChatState(prev => (prev === 'floating' || prev === 'minimized') ? 'normal' : prev);
      }

      // Scroll Spy
      const sections = document.querySelectorAll('section');
      const scrollPos = window.scrollY + 180;
      sections.forEach((section) => {
        const id = section.getAttribute('id');
        const top = section.offsetTop;
        const height = section.clientHeight;
        if (id && scrollPos >= top && scrollPos < top + height) {
          setActiveSection(id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle intro splash screen loader timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll reveal setup (simple React implementation)
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll chat to bottom — scroll ONLY the messages container, never the page
  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);



  // Contact Form submit logic
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSending(true);

    const formEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mdarvdvy";

    if (formEndpoint === "https://formspree.io/f/placeholder") {
      setTimeout(() => {
        setFormSending(false);
        setFormSubmitted(true);
        console.warn("Please configure NEXT_PUBLIC_FORMSPREE_ENDPOINT in Vercel to receive real emails.");
      }, 1500);
      return;
    }

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMessage,
        }),
      });

      if (response.ok) {
        setFormSubmitted(true);
      } else {
        alert("Oops! There was a problem submitting your form.");
      }
    } catch (error) {
      alert("Oops! There was a problem submitting your form.");
    } finally {
      setFormSending(false);
    }
  };

  const handleChatSubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Append user query
    setChatMessages(prev => [...prev, { text: queryText, sender: 'user' }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });
      const data = await res.json();
      
      setIsTyping(false);
      
      // Smart check for contact card token anywhere in the response
      const replyText = data.reply || "I'm sorry, I encountered an error connecting to my database.";
      const finalReply = replyText.includes('__CONTACT_CARD__') ? '__CONTACT_CARD__' : replyText;

      setChatMessages(prev => [...prev, { text: finalReply, sender: 'bot' }]);
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setChatMessages(prev => [...prev, { text: "Network error occurred.", sender: 'bot' }]);
    }
  };

  // Utility to parse markdown links in bot messages
  const parseBotLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Append text before match
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex, match.index) }} />);
      }
      // Append link
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex) }} />);
    }

    return parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <>
      {/* Screen Loader Splash */}
      <div className={`screen-loader ${!showLoader ? 'fade-out' : ''}`}>
        <div className="loader-content">
          <div className="loader-logo">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div className="loader-bar-container">
            <div className="loader-bar"></div>
          </div>
          <div className="loader-text">Loading Ashwin's Portfolio...</div>
        </div>
      </div>

      {/* Background Ambient Glows */}
      <div className="ambient-glows">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Header */}
      <header className={scrolled ? 'scroll-nav' : ''}>
        <div className="nav-container">
          <button
            className={`menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav>
            <ul id="nav-menu" className={mobileMenuOpen ? 'open' : ''}>
              <li><a href="#hero" className={`nav-link ${activeSection === 'hero' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</a></li>
              <li><a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>About</a></li>
              <li><a href="#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Skills</a></li>
              <li><a href="#experience" className={`nav-link ${activeSection === 'experience' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Experience</a></li>
              <li><a href="#projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Projects</a></li>
              <li><a href="#education" className={`nav-link ${activeSection === 'education' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Education</a></li>
              <li><a href="#certifications" className={`nav-link ${activeSection === 'certifications' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Certifications</a></li>
              <li><a href="#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero">
        <div className="hero-content centered">
          <h1 className="hero-title">
            Hi, I'm <span className="gradient-text">Ashwin Santhanakrishnan</span>
            <span className="typewriter">{typedText}</span>
          </h1>
          <p className="hero-desc">
            AI Engineer & Data Professional. Ask my AI assistant anything about my skills, projects, or experience!
          </p>

          <div
            className={[
              'hero-chat-centered-container',
              chatState === 'maximized' ? 'maximized' : '',
              chatState === 'floating' ? 'floating-overlay' : '',
              chatState === 'minimized' ? 'd-none' : '',
            ].filter(Boolean).join(' ')}
          >
            <div
              className={[
                'chatbot-panel-inline',
                'glass-panel',
                chatState === 'maximized' ? 'maximized' : '',
                chatMessages.length > 2 ? 'expanded' : '',
                isTyping ? 'thinking' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="chat-header">
                <div className="chat-title-info">
                  <div className="chat-avatar">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      Ashwin AI Assistant
                      <span className="chat-title-sub">✨ Best expanded</span>
                    </h4>
                    <div className="chat-status">
                      {isTyping ? 'Thinking...' : 'Online & Grounded'}
                    </div>
                  </div>
                </div>
                <div className="chat-window-controls">
                  {chatState === 'floating' ? (
                    <button
                      type="button"
                      className="window-control-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChatState('minimized');
                      }}
                      title="Minimize floating chat"
                      aria-label="Minimize chat"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="window-control-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChatState(chatState === 'maximized' ? 'normal' : 'maximized');
                      }}
                      title={chatState === 'maximized' ? "Restore window size" : "Maximize window size"}
                      aria-label="Toggle size"
                    >
                      <i className={`fa-solid ${chatState === 'maximized' ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="chat-messages" ref={chatMessagesContainerRef}>
                {chatMessages.map((msg, index) => {
                  if (msg.text === '__WELCOME_CARD__') {
                    return (
                      <div key={index} className="welcome-card-wrapper" style={{ alignSelf: 'center', width: '100%', maxWidth: '100%', margin: '0 auto', textAlign: 'center' }}>
                        <div className="welcome-card-header" style={{ justifyContent: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-rose)', flexShrink: 0 }}>
                            <img src="assets/ashwin.jpg" alt="Ashwin Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h3>👋 Hey there! I'm Ashwin</h3>
                          </div>
                        </div>
                        <div className="welcome-card-desc">
                          Data Professional & Power Apps Developer specializing in automated workflows, business intelligence solutions, and data engineering.
                        </div>
                        <div className="welcome-card-subtitle">Here's what you can do:</div>
                        <div className="welcome-options-grid">
                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChatSubmit("Who is Ashwin?");
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-robot"></i></span>
                            <span className="welcome-option-title">Ask me anything</span>
                            <span className="welcome-option-desc">About my work, process, or experience</span>
                          </button>

                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-compass"></i></span>
                            <span className="welcome-option-title">Browse portfolio</span>
                            <span className="welcome-option-desc">Scroll down to explore the traditional way</span>
                          </button>

                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setChatMessages(prev => [...prev, { text: "Get in touch", sender: 'user' }]);
                              setIsTyping(true);
                              setTimeout(() => {
                                setIsTyping(false);
                                setChatMessages(prev => [...prev, { text: "__CONTACT_CARD__", sender: 'bot' }]);
                              }, 800);
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-paper-plane"></i></span>
                            <span className="welcome-option-title">Get in touch</span>
                            <span className="welcome-option-desc">Reach out to discuss opportunities</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  if (msg.text === '__CONTACT_CARD__') {
                    return (
                      <div key={index} className="welcome-card-wrapper" style={{ alignSelf: 'center', width: '100%', maxWidth: '100%', margin: '0.5rem auto 0 auto', textAlign: 'center' }}>
                        <div className="welcome-card-header" style={{ justifyContent: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-rose)', flexShrink: 0 }}>
                            <img src="assets/ashwin.jpg" alt="Ashwin Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Connect with Ashwin</h3>
                          </div>
                        </div>
                        <div className="welcome-card-desc" style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Feel free to reach out directly through any of the channels below:
                        </div>
                        <div className="contact-options-grid">
                          <a
                            href="mailto:ashwin638525@gmail.com"
                            className="welcome-option-card"
                            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-envelope"></i></span>
                            <span className="welcome-option-title" style={{ marginTop: '0.2rem' }}>Email</span>
                            <span className="welcome-option-desc" style={{ fontSize: '0.65rem' }}>ashwin638525@gmail.com</span>
                          </a>

                          <a
                            href="https://linkedin.com/in/ashwin-santhanakrishanan-24abb1190"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="welcome-option-card"
                            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <span className="welcome-option-icon"><i className="fa-brands fa-linkedin-in"></i></span>
                            <span className="welcome-option-title" style={{ marginTop: '0.2rem' }}>LinkedIn</span>
                            <span className="welcome-option-desc" style={{ fontSize: '0.65rem' }}>ashwin-santhanakrishanan</span>
                          </a>

                          <a
                            href="https://github.com/AshwinSanthanakrishnan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="welcome-option-card"
                            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <span className="welcome-option-icon"><i className="fa-brands fa-github"></i></span>
                            <span className="welcome-option-title" style={{ marginTop: '0.2rem' }}>GitHub</span>
                            <span className="welcome-option-desc" style={{ fontSize: '0.65rem' }}>AshwinSanthanakrishnan</span>
                          </a>

                          <a
                            href="tel:+13014660040"
                            className="welcome-option-card"
                            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-phone"></i></span>
                            <span className="welcome-option-title" style={{ marginTop: '0.2rem' }}>Phone</span>
                            <span className="welcome-option-desc" style={{ fontSize: '0.65rem' }}>(301) 466 0040</span>
                          </a>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className={`chat-msg chat-msg-${msg.sender}`}>
                      {msg.sender === 'bot' ? parseBotLinks(msg.text) : msg.text}
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="chat-thinking-bubble" id="typing-indicator">
                    <span className="think-dots">
                      <span className="think-dot"></span>
                      <span className="think-dot"></span>
                      <span className="think-dot"></span>
                    </span>
                    <span>Ashwin AI is thinking…</span>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              <div className="chat-suggestions">
                {(['About Me', 'Projects', 'Skills', 'Experience', 'Contact'] as const).map((label) => {
                  const queries: Record<string, string> = {
                    'About Me': 'Who is Ashwin?',
                    'Projects': 'What are your projects?',
                    'Skills': 'What are your skills?',
                    'Experience': 'Where have you worked?',
                    'Contact': 'How to contact you?',
                  };
                  return (
                    <button
                      key={label}
                      type="button"
                      className="suggestion-pill"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChatSubmit(queries[label]); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <form
                className="chat-input-area"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    handleChatSubmit(chatInput);
                    setChatInput('');
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Ask me about Ashwin's skills, experience, projects..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  autoComplete="off"
                  required
                />
                <button type="submit" className="chat-send-btn" aria-label="Send message">
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="reveal">
        <div className="about-img-container">
          <div className="about-img-wrapper glass-panel">
            <img src="/assets/ashwin.jpg" alt="Ashwin Santhanakrishnan" className="about-img" />
          </div>
        </div>
        <div className="about-details">
          <h2>About Me</h2>
          <p>
            I am an AI Engineer & Data Professional experienced in AI data analysis, data engineering, data management, and BI reporting, with a strong background in Microsoft Power BI and Power Apps. Developed multiple applications for government projects, focusing on data organization, ETL processes, automation, and visualization. Skilled in improving data processes to support informed decision-making.
          </p>
          <div className="about-stats">
            <div className="stat-card glass-panel">
              <span className="stat-number">3+</span>
              <span className="stat-label">Years of Experience</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">6+</span>
              <span className="stat-label">Projects Completed</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">25+</span>
              <span className="stat-label">Tools & Languages</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">2</span>
              <span className="stat-label">Certifications</span>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="reveal">
        <h2>Technical Skills</h2>
        <div className="skills-container">
          {/* AI Tools */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-robot" style={{ color: 'var(--accent-cyan)' }}></i> AI Tools & Frameworks</h3>
            <div className="skills-list">
              <span className="skill-tag">Rag</span>
              <span className="skill-tag">LangChain</span>
              <span className="skill-tag">Cursor AI</span>
              <span className="skill-tag">Claude AI</span>
              <span className="skill-tag">OpenAI Codex</span>
              <span className="skill-tag">Google Antigravity</span>
              <span className="skill-tag">Vapi AI</span>
              <span className="skill-tag">Manus</span>
              <span className="skill-tag">n8n</span>
              <span className="skill-tag">Google Studio AI</span>
            </div>
          </div>

          {/* Languages */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-code" style={{ color: 'var(--accent-cyan)' }}></i> Programming Languages</h3>
            <div className="skills-list">
              <span className="skill-tag">Python</span>
              <span className="skill-tag">DAX</span>
              <span className="skill-tag">SQL</span>
              <span className="skill-tag">JavaScript</span>
              <span className="skill-tag">R</span>
            </div>
          </div>

          {/* BI */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-chart-pie" style={{ color: 'var(--accent-purple)' }}></i> Business Intelligence</h3>
            <div className="skills-list">
              <span className="skill-tag">Microsoft Power BI</span>
              <span className="skill-tag">Tableau</span>
              <span className="skill-tag">Google Looker Studio</span>
              <span className="skill-tag">Paginated Report Builder</span>
            </div>
          </div>

          {/* Platforms */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-cubes" style={{ color: 'var(--accent-cyan)' }}></i> Platforms & Tools</h3>
            <div className="skills-list">
              <span className="skill-tag">Microsoft Power Apps</span>
              <span className="skill-tag">Power Automate</span>
              <span className="skill-tag">Dataverse</span>
              <span className="skill-tag">Azure DevOps</span>
              <span className="skill-tag">SharePoint</span>
              <span className="skill-tag">Oracle Apex</span>
              <span className="skill-tag">Google Ads</span>
              <span className="skill-tag">Meta Ads</span>
              <span className="skill-tag">Amazon Ads</span>
              <span className="skill-tag">Versal</span>
              <span className="skill-tag">Twilio</span>
            </div>
          </div>

          {/* Databases */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-database" style={{ color: 'var(--accent-purple)' }}></i> Databases</h3>
            <div className="skills-list">
              <span className="skill-tag">Microsoft Dataverse</span>
              <span className="skill-tag">SQL Server</span>
              <span className="skill-tag">MySQL</span>
              <span className="skill-tag">SQLite</span>
              <span className="skill-tag">PostgreSQL</span>
              <span className="skill-tag">Pinecone</span>
            </div>
          </div>

          {/* Data Management */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-gears" style={{ color: 'var(--accent-cyan)' }}></i> Data Management</h3>
            <div className="skills-list">
              <span className="skill-tag">ETL Processes</span>
              <span className="skill-tag">Data Modeling</span>
              <span className="skill-tag">Data Migration</span>
              <span className="skill-tag">Cleaning & Transformation</span>
              <span className="skill-tag">Automation</span>
            </div>
          </div>

          {/* Cloud & OS */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-cloud" style={{ color: 'var(--accent-purple)' }}></i> Cloud & OS</h3>
            <div className="skills-list">
              <span className="skill-tag">AWS Console</span>
              <span className="skill-tag">Windows</span>
              <span className="skill-tag">Linux</span>
              <span className="skill-tag">Mac</span>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="reveal">
        <h2>Professional Experience</h2>
        <div className="timeline">

          <div className="timeline-item">
            <div className="timeline-badge"></div>
            <div className="timeline-content glass-panel">
              <span className="timeline-date">October 2025 - May 2026</span>
              <h3>AI Data Analyst</h3>
              <span className="timeline-company">Dementia Aide | CA</span>
              <ul>
                <li>Extracted and analyzed large-scale multi-year e-commerce datasets using Python to identify statistical trends in search term performance, optimizing revenue and key performance metrics by 70%.</li>
                <li>Built automated workflow scripts using Vibe coding and prompt engineering in Cursor AI, replacing 15+ hours of manual spreadsheet categorization of raw CSV exports by processing 26,000+ negative keywords into platform-ready lists.</li>
                <li>Created Power BI dashboards to visualize ad performance and user demographics, speeding up internal decision-making.</li>
                <li>Conducted historical data analysis across 20+ multi-channel campaigns to formulate data-driven strategies, optimizing Return on Ad Spend (ROAS) to over 4.0 and increasing conversion rates.</li>
                <li>Formulated data-driven campaigns and continuously monitored and adjusted cross-channel budget allocations to ensure optimal ad spend.</li>
              </ul>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge"></div>
            <div className="timeline-content glass-panel">
              <span className="timeline-date">May 2023 - August 2024</span>
              <h3>Data Engineer / Power Apps Developer</h3>
              <span className="timeline-company">Ark Infotech LLC | MD</span>
              <ul>
                <li><strong>NIH Data Applications:</strong> Developed 6 custom data applications integrating Power Apps and Power BI dashboards to enable data-driven reporting and decision-making for government stakeholders.</li>
                <li><strong>Dataverse Modeling & Migration:</strong> Designed relational data models in Microsoft Dataverse, successfully migrating and integrating legacy datasets from SharePoint, Excel, and Access databases.</li>
                <li><strong>Vibe Coding & Automation:</strong> Configured Playwright MCP setup and used Vibe coding to generate browser automation testing scripts, significantly reducing manual testing cycles and ensuring platform stability.</li>
                <li><strong>Python ETL & Workflows:</strong> Built Python-based ETL pipelines and automated Power Automate workflows to clean, structure, and transition complex datasets into relational formats.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="reveal">
        <h2>Featured Projects</h2>
        <div className="projects-grid">

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/power-apps.jpg" alt="Intelligent Hiring Assistant" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Intelligent Hiring Assistant</h3>
              <p>
                An applied Natural Language Processing (NLP) system designed to automate candidate resume screening, key skill extraction, and profile analysis for streamlined talent acquisition.
              </p>
              <div className="project-tags">
                <span className="project-tag">TypeScript</span>
                <span className="project-tag">NLP</span>
                <span className="project-tag">Node.js</span>
                <span className="project-tag">Applied ML</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/intelligent-hiring-assistant" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/house-prediction.jpg" alt="House Price Prediction" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>House Price Prediction Model</h3>
              <p>
                A machine learning project built with Python and Jupyter Notebooks, incorporating real estate market analysis, regression modeling, and feature engineering to predict property pricing accurately.
              </p>
              <div className="project-tags">
                <span className="project-tag">Python</span>
                <span className="project-tag">Jupyter</span>
                <span className="project-tag">Pandas</span>
                <span className="project-tag">Scikit-Learn</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/House-Price-Prediction" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/etl-pipeline.jpg" alt="Mini-Project NLP Systems" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Mini-Project NLP Systems</h3>
              <p>
                An intelligent text understanding system utilizing pre-trained language models for sentiment analysis, semantic sorting, and sentence tokenization within node environments.
              </p>
              <div className="project-tags">
                <span className="project-tag">TypeScript</span>
                <span className="project-tag">NLP</span>
                <span className="project-tag">Machine Learning</span>
                <span className="project-tag">Model Deployment</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/Mini-Project-NLP" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/power-bi.jpg" alt="Reports & BI Dashboards" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Reports & BI Dashboards</h3>
              <p>
                A curated portfolio of customized business intelligence reports, interactive Power BI visualizations, and automated data architectures designed for executive decision-making.
              </p>
              <div className="project-tags">
                <span className="project-tag">Power BI</span>
                <span className="project-tag">Reporting</span>
                <span className="project-tag">Data Modeling</span>
                <span className="project-tag">SQL</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/Reports" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="reveal">
        <h2>Education</h2>
        <div className="certs-grid">
          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="cert-details">
              <h3>Master of Science in Data Analytics</h3>
              <p>Catholic University of America | May 2026</p>
            </div>
          </div>

          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="cert-details">
              <h3>Bachelor of Science in Computer Engineering</h3>
              <p>State University of New York (SUNY) | May 2023</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="reveal">
        <h2>Certifications</h2>
        <div className="certs-grid">
          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="cert-details">
              <h3>Microsoft Certified: Power Platform Developer Associate</h3>
              <p>Validated skills in building Power Apps, Power Automate flows, securing Dataverse solutions, and creating Power BI components.</p>
            </div>
          </div>

          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="cert-details">
              <h3>Microsoft Certified: Power Platform Fundamentals</h3>
              <p>Core knowledge of Power Platform capabilities, security model, business value, and database integration workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="reveal">
        <h2>Get In Touch</h2>
        <div className="contact-container">
          <div className="contact-info">
            <h3>Let's start a conversation</h3>
            <p>Whether you're looking to consult on data pipelines, looking for a Power Platform application developer, or want to collaborate on AI-driven analytics, feel free to drop a message!</p>
            <div className="contact-methods">
              <a href="mailto:ashwin638525@gmail.com" className="contact-method">
                <i className="fa-solid fa-envelope"></i>
                <span>ashwin638525@gmail.com</span>
              </a>
              <a href="tel:+13014660040" className="contact-method">
                <i className="fa-solid fa-phone"></i>
                <span>(301) 466 0040</span>
              </a>
              <a href="https://github.com/AshwinSanthanakrishnan" target="_blank" rel="noopener noreferrer" className="contact-method">
                <i className="fa-brands fa-github"></i>
                <span>github.com/AshwinSanthanakrishnan</span>
              </a>
              <a href="https://linkedin.com/in/ashwin-santhanakrishanan-24abb1190" target="_blank" rel="noopener noreferrer" className="contact-method">
                <i className="fa-brands fa-linkedin"></i>
                <span>linkedin.com/in/ashwin-santhanakrishanan-24abb1190</span>
              </a>
            </div>
          </div>

          <form className="contact-form glass-panel" onSubmit={handleContactSubmit}>
            {formSubmitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--accent-cyan)' }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', margin: 0, background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '320px', fontSize: '0.95rem', lineHeight: '1.6' }}>Thank you, <strong>{formName}</strong>. Your message was successfully dispatched. I'll get back to you at <strong>{formEmail}</strong> within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="form-name">Name</label>
                  <input type="text" id="form-name" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-email">Email Address</label>
                  <input type="email" id="form-email" placeholder="john@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-subject">Subject</label>
                  <input type="text" id="form-subject" placeholder="Project Inquiry" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-message">Message</label>
                  <textarea id="form-message" rows={5} placeholder="Let's build something awesome..." value={formMessage} onChange={(e) => setFormMessage(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="btn-primary" disabled={formSending}>
                  {formSending ? (
                    <>Sending... <i className="fa-solid fa-spinner fa-spin"></i></>
                  ) : (
                    <>Send Message <i className="fa-solid fa-paper-plane"></i></>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; 2026 Ashwin Santhanakrishnan. All Rights Reserved. Built with custom CSS & Next.js + React.</p>
      </footer>

      {/* Floating Minimized Trigger */}
      {chatState === 'minimized' && showStickyBar && (
        <button
          type="button"
          className="chatbot-minimized-trigger"
          onClick={() => setChatState('floating')}
          aria-label="Open AI Assistant"
        >
          <i className="fa-solid fa-comments"></i>
          <span className="minimized-badge"></span>
        </button>
      )}

      {/* Sticky Chat Typing Bar */}
      {showStickyBar && chatState !== 'floating' && (
        <div className="sticky-chat-bar-container">
          <form
            className="sticky-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                handleChatSubmit(chatInput);
                setChatState('floating');
              }
            }}
          >
            <input
              type="text"
              placeholder="Ask Ashwin's AI anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !chatInput.trim()}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
